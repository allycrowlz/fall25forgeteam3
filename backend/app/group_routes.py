from fastapi import APIRouter, HTTPException
import string
import random
from psycopg2.extras import RealDictCursor
from backend.db.connection import get_connection
from backend.db.pydanticmodels import (
    GroupCreate, 
    GroupUpdate, 
    GroupMember, 
    JoinGroup
)

router = APIRouter()


# Invite code generation utility - NOW WITH UNIQUENESS CHECK
def generate_unique_invite_code(length=8):
    """Generate a truly unique invite code"""
    characters = string.ascii_uppercase + string.digits
    
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        max_attempts = 100
        for _ in range(max_attempts):
            code = ''.join(random.choices(characters, k=length))
            
            # Check if code already exists
            cur.execute("""
                SELECT join_code FROM "Group" WHERE join_code = %s
            """, (code,))
            
            if cur.fetchone() is None:
                return code
        
        raise HTTPException(status_code=500, detail="Failed to generate unique code")
    finally:
        cur.close()
        conn.close()


# POST /groups - Create a new group
@router.post("/groups", status_code=201)
async def create_group(group: GroupCreate):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        join_code = generate_unique_invite_code()
    
        cur.execute("""
            INSERT INTO "Group" (group_name, date_created, group_photo, join_code)
            VALUES (%s, NOW(), %s, %s)
            RETURNING group_id, group_name, date_created, group_photo, join_code
        """, (group.group_name, group.group_photo, join_code))
        
        row = cur.fetchone()

        cur.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'creator')
        """, (row['group_id'], group.profile_id))
        
        conn.commit()
        
        # Return with is_creator field
        return {
            "group_id": row['group_id'],
            "group_name": row['group_name'],
            "date_created": row['date_created'],
            "group_photo": row['group_photo'],
            "join_code": row['join_code'],
            "role": "creator",
            "is_creator": True
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# POST /groups/join - Join a group using join code
@router.post("/groups/join")
async def join_group(join_data: JoinGroup):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT group_id, group_name, group_photo 
            FROM "Group" 
            WHERE join_code = %s
        """, (join_data.join_code,))
        
        group = cur.fetchone()
        
        if not group:
            raise HTTPException(status_code=404, detail="Invalid join code")

        cur.execute("""
            SELECT group_id FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (group['group_id'], join_data.profile_id))
        
        existing = cur.fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already a member of this group")
  
        cur.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'member')
        """, (group['group_id'], join_data.profile_id))
        
        conn.commit()
        
        return {
            "message": "Successfully joined group",
            "group": dict(group)
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# GET /groups - Get all groups for current user
@router.get('/groups')
async def get_groups(profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT g.group_id, g.group_name, g.date_created, g.group_photo, 
                   gp.role, g.join_code,
                   (gp.role = 'creator') as is_creator
            FROM "Group" g
            INNER JOIN groupprofile gp ON g.group_id = gp.group_id
            WHERE gp.profile_id = %s
            ORDER BY g.date_created DESC
        """, (profile_id,))
        
        groupData = cur.fetchall()
        return groupData
    finally:
        cur.close()
        conn.close()


# GET /groups/:id - Get a specific group
@router.get("/groups/{id}")
async def get_group(id: int, profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT g.group_id, g.group_name, g.date_created, g.group_photo, g.join_code,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM "Group" g
            INNER JOIN groupprofile gp ON g.group_id = gp.group_id
            WHERE g.group_id = %s AND gp.profile_id = %s
        """, (id, profile_id))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Group not found or access denied")
        
        return dict(row)
    finally:
        cur.close()
        conn.close()


# GET /groups/:id/members - Get all members of a group
@router.get("/groups/{id}/members")
async def get_group_members(id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT group_id FROM groupprofile
            WHERE group_id = %s
        """, (id,))
        
        membership = cur.fetchone()
 
        cur.execute("""
            SELECT p.profile_id, p.profile_name, p.email, p.picture, p.birthday,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM groupprofile gp
            INNER JOIN profile p ON gp.profile_id = p.profile_id
            WHERE gp.group_id = %s
            ORDER BY gp.role DESC, p.profile_name
        """, (id,))

        members = cur.fetchall()
        return members
    finally:
        cur.close()
        conn.close()


# PUT /groups/:id - Update a group
@router.put("/groups/{id}")
async def update_group(id: int, group: GroupUpdate, profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, profile_id))
        
        user_role = cur.fetchone()
        
        if not user_role or user_role['role'] != 'creator':
            raise HTTPException(status_code=403, detail="Only group creator can update the group")
  
        cur.execute("""
            UPDATE "Group" 
            SET group_name = %s, group_photo = %s
            WHERE group_id = %s
            RETURNING group_id, group_name, date_created, group_photo, join_code
        """, (group.group_name, group.group_photo, id))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        
        conn.commit()
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# DELETE /groups/:id - Delete a group (creator only)
@router.delete("/groups/{id}")
async def delete_group(id: int, profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if user is creator
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, profile_id))
        
        user_role = cur.fetchone()
        
        if not user_role or user_role['role'] != 'creator':
            raise HTTPException(status_code=403, detail="Only group creator can delete the group")
        
        # Delete all group members first (due to foreign key constraints)
        cur.execute("""
            DELETE FROM groupprofile
            WHERE group_id = %s
        """, (id,))
        
        # Delete the group
        cur.execute("""
            DELETE FROM "Group"
            WHERE group_id = %s
            RETURNING group_id
        """, (id,))
        
        deleted = cur.fetchone()
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Group not found")
        
        conn.commit()
        return {"message": "Group deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# POST /groups/:id/regenerate-code - Regenerate join code
@router.post("/groups/{id}/regenerate-code")
async def regenerate_join_code(id: int, profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if user is creator
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, profile_id))
        
        user_role = cur.fetchone()
        
        if not user_role or user_role['role'] != 'creator':
            raise HTTPException(status_code=403, detail="Only group creator can regenerate join code")
        
        # Generate new unique code
        new_code = generate_unique_invite_code()
        
        # Update the group
        cur.execute("""
            UPDATE "Group"
            SET join_code = %s
            WHERE group_id = %s
            RETURNING join_code
        """, (new_code, id))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        
        conn.commit()
        return {"join_code": row['join_code']}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# DELETE /groups/:id/members/:user_id - Remove a member from group
@router.delete("/groups/{id}/members/{user_id}")
async def remove_member(id: int, user_id: int, profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, profile_id))
        
        requester_role = cur.fetchone()
        
        if not requester_role or requester_role['role'] != 'creator':
            raise HTTPException(status_code=403, detail="Only group creator can remove members")
      
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, user_id))
        
        member = cur.fetchone()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        if member['role'] == 'creator':
            raise HTTPException(status_code=400, detail="Cannot remove group creator")
     
        cur.execute("""
            DELETE FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, user_id))
        
        conn.commit()
        return {"message": "Member removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# POST /groups/:id/leave - Leave a group
@router.post("/groups/{id}/leave")
async def leave_group(id: int, profile_id: int):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, profile_id))
        
        membership = cur.fetchone()
        
        if not membership:
            raise HTTPException(status_code=404, detail="You are not a member of this group")
        
        if membership['role'] == 'creator':
            raise HTTPException(
                status_code=400, 
                detail="Group creator cannot leave. Delete the group instead."
            )

        cur.execute("""
            DELETE FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, profile_id))
        
        conn.commit()
        return {"message": "Successfully left the group"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.get("/groups/{group_id}/events")
async def get_group_events(
    group_id: int,
    start: str,
    end: str,
    profile_id: int
):
    """Get all events for members of a specific group"""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # First verify that the requesting user is a member of this group
        cur.execute("""
            SELECT profile_id FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (group_id, profile_id))
        
        membership = cur.fetchone()
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Get all events for group members within the date range
        cur.execute("""
            SELECT DISTINCT e.event_id,
                   e.event_name,
                   e.event_datetime_start,
                   e.event_datetime_end,
                   e.event_location,
                   e.event_notes,
                   pe.profile_id,
                   e.group_id
            FROM Event e
            JOIN ProfileEvent pe ON e.event_id = pe.event_id
            WHERE e.group_id = %s
              AND e.event_datetime_start BETWEEN %s AND %s
            ORDER BY e.event_datetime_start
        """, (group_id, start, end))
        
        events = cur.fetchall()
        return events
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()