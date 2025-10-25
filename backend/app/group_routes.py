from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import string
import random
from psycopg2.extras import RealDictCursor
from database.connection import get_connection
from app.security import decode_token

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency for authentication
async def get_current_user_from_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        token = authorization.split(" ")[1]
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user_id

# Invite code generation utility
def generate_invite_code(length=8):
    """Generate a unique invite code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=length))

# Pydantic models
class GroupCreate(BaseModel):
    group_name: str
    group_photo: Optional[str] = None

class GroupUpdate(BaseModel):
    group_name: str
    group_photo: Optional[str] = None

class JoinGroup(BaseModel):
    join_code: str

class GroupResponse(BaseModel):
    group_id: int
    group_name: str
    date_created: datetime
    group_photo: Optional[str] = None
    join_code: str
    role: Optional[str] = None
    is_creator: Optional[bool] = None

class GroupMemberResponse(BaseModel):
    profile_id: int
    profile_name: str
    email: str
    picture: Optional[str] = None
    role: str
    is_creator: bool

class MessageResponse(BaseModel):
    message: str

# POST /api/groups - Create a new group
@app.post("/api/groups", status_code=201, response_model=GroupResponse)
async def create_group(group: GroupCreate, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        join_code = generate_invite_code()
    
        cur.execute("""
            INSERT INTO "group" (group_name, date_created, group_photo, join_code)
            VALUES (%s, NOW(), %s, %s)
            RETURNING group_id, group_name, date_created, group_photo, join_code
        """, (group.group_name, group.group_photo, join_code))
        
        row = cur.fetchone()

        cur.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'creator')
        """, (row['group_id'], user_id))
        
        conn.commit()
        
        return GroupResponse(
            group_id=row['group_id'],
            group_name=row['group_name'],
            date_created=row['date_created'],
            group_photo=row['group_photo'],
            join_code=row['join_code'],
            role='creator',
            is_creator=True
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# POST /api/groups/join - Join a group using join code
@app.post("/api/groups/join", response_model=GroupResponse)
async def join_group(join_data: JoinGroup, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        cur.execute("""
            SELECT group_id, group_name, group_photo, date_created, join_code
            FROM "group" 
            WHERE join_code = %s
        """, (join_data.join_code,))
        
        group = cur.fetchone()
        
        if not group:
            raise HTTPException(status_code=404, detail="Invalid join code")

        cur.execute("""
            SELECT group_id FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (group['group_id'], user_id))
        
        existing = cur.fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Already a member of this group")
  
        cur.execute("""
            INSERT INTO groupprofile (group_id, profile_id, role)
            VALUES (%s, %s, 'member')
        """, (group['group_id'], user_id))
        
        conn.commit()
        
        return GroupResponse(
            group_id=group['group_id'],
            group_name=group['group_name'],
            date_created=group['date_created'],
            group_photo=group['group_photo'],
            join_code=group['join_code'],
            role='member',
            is_creator=False
        )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# GET /api/groups - Get all groups for current user
@app.get("/api/groups", response_model=List[GroupResponse])
async def get_groups(user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        cur.execute("""
            SELECT g.group_id, g.group_name, g.date_created, g.group_photo, g.join_code,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM "group" g
            INNER JOIN groupprofile gp ON g.group_id = gp.group_id
            WHERE gp.profile_id = %s
            ORDER BY g.date_created DESC
        """, (user_id,))
        
        rows = cur.fetchall()
        return [GroupResponse(**dict(row)) for row in rows]
    finally:
        cur.close()
        conn.close()

# GET /api/groups/:id - Get a specific group
@app.get("/api/groups/{id}", response_model=GroupResponse)
async def get_group(id: int, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        cur.execute("""
            SELECT g.group_id, g.group_name, g.date_created, g.group_photo, g.join_code,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM "group" g
            INNER JOIN groupprofile gp ON g.group_id = gp.group_id
            WHERE g.group_id = %s AND gp.profile_id = %s
        """, (id, user_id))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Group not found or access denied")
        
        return GroupResponse(**dict(row))
    finally:
        cur.close()
        conn.close()

# GET /api/groups/:id/members - Get all members of a group
@app.get("/api/groups/{id}/members", response_model=List[GroupMemberResponse])
async def get_group_members(id: int, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        cur.execute("""
            SELECT group_id FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, user_id))
        
        membership = cur.fetchone()
        
        if not membership:
            raise HTTPException(status_code=403, detail="Access denied")
 
        cur.execute("""
            SELECT p.profile_id, p.profile_name, p.email, p.picture,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM groupprofile gp
            INNER JOIN profile p ON gp.profile_id = p.profile_id
            WHERE gp.group_id = %s
            ORDER BY gp.role DESC, p.profile_name
        """, (id,))
        
        rows = cur.fetchall()
        return [GroupMemberResponse(**dict(row)) for row in rows]
    finally:
        cur.close()
        conn.close()

# PUT /api/groups/:id - Update a group
@app.put("/api/groups/{id}", response_model=GroupResponse)
async def update_group(id: int, group: GroupUpdate, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, user_id))
        
        user_role = cur.fetchone()
        
        if not user_role or user_role['role'] != 'creator':
            raise HTTPException(status_code=403, detail="Only group creator can update the group")
  
        cur.execute("""
            UPDATE "group" 
            SET group_name = %s, group_photo = %s
            WHERE group_id = %s
            RETURNING group_id, group_name, date_created, group_photo, join_code
        """, (group.group_name, group.group_photo, id))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        
        conn.commit()
        return GroupResponse(**dict(row), role='creator', is_creator=True)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# DELETE /api/groups/:id/members/:user_id - Remove a member from group
@app.delete("/api/groups/{id}/members/{member_id}", response_model=MessageResponse)
async def remove_member(id: int, member_id: int, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    
    try:
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, user_id))
        
        requester_role = cur.fetchone()
        
        if not requester_role or requester_role['role'] != 'creator':
            raise HTTPException(status_code=403, detail="Only group creator can remove members")
      
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, member_id))
        
        member = cur.fetchone()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        if member['role'] == 'creator':
            raise HTTPException(status_code=400, detail="Cannot remove group creator")
     
        cur.execute("""
            DELETE FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, member_id))
        
        conn.commit()
        return MessageResponse(message="Member removed successfully")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# POST /api/groups/:id/leave - Leave a group
@app.post("/api/groups/{id}/leave", response_model=MessageResponse)
async def leave_group(id: int, user_id: int = Depends(get_current_user_from_token)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    conn = get_connection()
    
    try:
        cur.execute("""
            SELECT role FROM groupprofile
            WHERE group_id = %s AND profile_id = %s
        """, (id, user_id))
        
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
        """, (id, user_id))
        
        conn.commit()
        return MessageResponse(message="Successfully left the group")
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()