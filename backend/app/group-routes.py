from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import string
import random
from psycopg2.extras import RealDictCursor

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from database import connection
from database.pydanticmodels import ExpenseItemCreate, Group
from database import expense_queries

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GroupMember(BaseModel):
    profile_id: int
    profile_name: str
    email: str
    picture: Optional[str]
    role: str
    is_creator: bool


# Invite code generation utility
def generate_invite_code(length=8):
    """Generate a unique invite code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=length))

# Pydantic models
class GroupCreate(BaseModel):
    group_name: str
    group_photo: Optional[str] = None
    profile_id: int

class GroupUpdate(BaseModel):
    group_name: str
    group_photo: Optional[str] = None

class JoinGroup(BaseModel):
    join_code: str
    profile_id: int

# POST /api/groups - Create a new group
@app.post("/api/groups", status_code=201)
async def create_group(group: GroupCreate):

    conn = connection.get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
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
        """, (row['group_id'], group.profile_id))
        
        conn.commit()
        
        return {
            "group_id": row['group_id'],
            "group_name": row['group_name'],
            "date_created": row['date_created'],
            "group_photo": row['group_photo'],
            "join_code": row['join_code']
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# POST /api/groups/join - Join a group using join code
@app.post("/api/groups/join")
async def join_group(join_data: JoinGroup):

    conn = connection.get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT group_id, group_name, group_photo 
            FROM "group" 
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
            INSERT INTO groupprofile_junction (group_id, profile_id, role)
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

# GET /api/groups - Get all groups for current user
@app.get('/api/groups')
async def get_groups(profile_id: int):

    conn = connection.get_connection()
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
        return [Group(**group) for group in groupData]
    finally:
        cur.close()
        conn.close()

# GET /api/groups/:id - Get a specific group
@app.get("/api/groups/{id}")
async def get_group(id: int, profile_id: int):
    conn = connection.get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT g.group_id, g.group_name, g.date_created, g.group_photo, g.join_code,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM "group" g
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

# GET /api/groups/:id/members - Get all members of a group
@app.get("/api/groups/{id}/members")
async def get_group_members(id: int):
    conn = connection.get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("""
            SELECT group_id FROM groupprofile
            WHERE group_id = %s
        """, (id,))
        
        membership = cur.fetchone()
        
        # if not membership:
        #     raise HTTPException(status_code=403, detail="Access denied")
 
        cur.execute("""
            SELECT p.profile_id, p.profile_name, p.email, p.picture,
                   gp.role,
                   (gp.role = 'creator') as is_creator
            FROM groupprofile gp
            INNER JOIN profile p ON gp.profile_id = p.profile_id
            WHERE gp.group_id = %s
            ORDER BY gp.role DESC, p.profile_name
        """, (id,))

        
        members = cur.fetchall()
        return [GroupMember(**member) for member in members]
    finally:
        cur.close()
        conn.close()

# PUT /api/groups/:id - Update a group
@app.put("/api/groups/{id}")
async def update_group(id: int, group: GroupUpdate, profile_id: int):
    conn = connection.get_connection()
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
            UPDATE "group" 
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

# DELETE /api/groups/:id/members/:user_id - Remove a member from group
@app.delete("/api/groups/{id}/members/{user_id}")
async def remove_member(id: int, user_id: int, profile_id: int):
    conn = connection.get_connection()
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

# POST /api/groups/:id/leave - Leave a group
@app.post("/api/groups/{id}/leave")
async def leave_group(id: int, profile_id: int):
    conn = connection.get_connection()
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


@app.get("/api/groups/{group_id}/expenselists")
async def get_group_lists(group_id: int):
    """
    Gets all expense lists for a given group id
    """
    return expense_queries.get_group_lists(group_id)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/expenseslists/expenses", status_code=201)
async def create_expense(expense: ExpenseItemCreate):
    """
    Creates a new expense using the inputted data parsed into a PydanticCreateModel
    """
    return expense_queries.create_expense(expense)


@app.put("/api/expenses/{id}")
async def update_or_create_expense(expense: ExpenseItemCreate, id: int):
    """Not yet implemented."""


@app.delete("/api/expenses/{item_id}")
async def delete_expense(item_id: int):
    """
    Deletes the expense with the given expense id
    """
    expense_queries.delete_expense(item_id)
    return {"message": f"Expense {item_id} deleted"}
    
@app.get("/api/expenseslists/{list_id}/expenses")
async def get_all_expenses_in_list(list_id: int):
    """
    Gets all expenses in a given expense list
    """
    return expense_queries.get_all_expenses_in_list(list_id)

@app.get("/api/expenseslists/{list_id}/expenses/{item_id}")
async def get_all_expenses_in_list(list_id: int, item_id: int):
    """
    Gets an expense in a given list at a given expense, 
    note: can probably remove list_id as a parameter but this is due 
    soon so I'll change it for the next commit.
    """
    return expense_queries.get_item_in_list(list_id, item_id)

@app.get("/api/groups/{group_id}/expenselists")
async def get_group_lists(group_id: int):
    """
    Gets all expense lists for a given group id
    """
    return expense_queries.get_group_lists(group_id)

@app.get("/api/groups/{group_id}/expenseslists/{list_id}/expenses/balance")
async def total_balance(id: int):
    """Not yet implemented"""

# @app.put("/api/expenses/:id/splits/:split_id/paid")

