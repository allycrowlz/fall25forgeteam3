from backend.db.connection import get_connection
from datetime import datetime
from typing import Optional, List, Dict

# ==================== CHORE CRUD ====================

def create_chore(group_id: int, name: str, due_date: Optional[datetime] = None, 
                 notes: Optional[str] = None) -> int:
    """
    Create a new chore
    Returns the chore_id
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Chore (group_id, name, due_date, notes)
            VALUES (%s, %s, %s, %s)
            RETURNING chore_id
        """, (group_id, name, due_date, notes))
        
        chore_id = cursor.fetchone()['chore_id']
        conn.commit()
        return chore_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error creating chore: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_chore_by_id(chore_id: int) -> Optional[Dict]:
    """Get a single chore by ID"""
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT chore_id, group_id, name, assigned_date, due_date, notes
            FROM Chore
            WHERE chore_id = %s
        """, (chore_id,))
        
        result = cursor.fetchone()
        return dict(result) if result else None
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_chores_for_group(group_id: int) -> List[Dict]:
    """Get all chores for a specific group"""
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT chore_id, group_id, name, assigned_date, due_date, notes
            FROM Chore
            WHERE group_id = %s
            ORDER BY due_date ASC NULLS LAST, assigned_date DESC
        """, (group_id,))
        
        results = cursor.fetchall()
        return [dict(row) for row in results]
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_chores_with_assignees(group_id: int) -> List[Dict]:
    """
    Get all chores for a group with their assignees
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                c.chore_id,
                c.group_id,
                c.name,
                c.assigned_date,
                c.due_date,
                c.notes,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'profile_id', ca.profile_id,
                            'profile_name', p.profile_name,
                            'status', ca.individual_status
                        )
                    ) FILTER (WHERE ca.profile_id IS NOT NULL),
                    '[]'
                ) as assignees
            FROM Chore c
            LEFT JOIN ChoreAssignee ca ON c.chore_id = ca.chore_id
            LEFT JOIN Profile p ON ca.profile_id = p.profile_id
            WHERE c.group_id = %s
            GROUP BY c.chore_id, c.group_id, c.name, c.assigned_date, c.due_date, c.notes
            ORDER BY c.due_date ASC NULLS LAST, c.assigned_date DESC
        """, (group_id,))
        
        results = cursor.fetchall()
        return [dict(row) for row in results]
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def assign_chore_to_profile(chore_id: int, profile_id: int) -> bool:
    """
    Assign a chore to a profile
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO ChoreAssignee (chore_id, profile_id, individual_status)
            VALUES (%s, %s, 'pending')
            ON CONFLICT (profile_id, chore_id) DO NOTHING
        """, (chore_id, profile_id))
        
        conn.commit()
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error assigning chore: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def unassign_chore_from_profile(chore_id: int, profile_id: int) -> bool:
    """
    Remove a profile from a chore assignment
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM ChoreAssignee
            WHERE chore_id = %s AND profile_id = %s
        """, (chore_id, profile_id))
        
        conn.commit()
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error unassigning chore: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_chores_for_profile(profile_id: int) -> List[Dict]:
    """
    Get all chores assigned to a specific profile
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                c.chore_id,
                c.group_id,
                c.name,
                c.assigned_date,
                c.due_date,
                c.notes,
                ca.individual_status,
                g.group_name
            FROM Chore c
            JOIN ChoreAssignee ca ON c.chore_id = ca.chore_id
            JOIN "Group" g ON c.group_id = g.group_id
            WHERE ca.profile_id = %s
            ORDER BY c.due_date ASC NULLS LAST, c.assigned_date DESC
        """, (profile_id,))
        
        results = cursor.fetchall()
        return [dict(row) for row in results]
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_chore_status(chore_id: int, profile_id: int, status: str) -> bool:
    """
    Update the status of a chore for a specific profile
    Status must be 'pending' or 'completed'
    """
    conn = None
    cursor = None
    
    if status not in ['pending', 'completed']:
        raise ValueError("Status must be 'pending' or 'completed'")
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE ChoreAssignee
            SET individual_status = %s
            WHERE chore_id = %s AND profile_id = %s
        """, (status, chore_id, profile_id))
        
        conn.commit()
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error updating chore status: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def toggle_chore_status(chore_id: int, profile_id: int) -> str:
    """
    Toggle chore status between pending and completed
    Returns the new status
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE ChoreAssignee
            SET individual_status = CASE 
                WHEN individual_status = 'pending' THEN 'completed'
                ELSE 'pending'
            END
            WHERE chore_id = %s AND profile_id = %s
            RETURNING individual_status
        """, (chore_id, profile_id))
        
        result = cursor.fetchone()
        conn.commit()
        
        return result['individual_status'] if result else None
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error toggling chore status: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_chores_for_profile(profile_id: int) -> List[Dict]:
    """
    Get all chores assigned to a specific profile
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                c.chore_id,
                c.group_id,
                c.name,
                c.assigned_date,
                c.due_date,
                c.notes,
                ca.individual_status,
                g.group_name
            FROM Chore c
            JOIN ChoreAssignee ca ON c.chore_id = ca.chore_id
            JOIN "Group" g ON c.group_id = g.group_id
            WHERE ca.profile_id = %s
            ORDER BY c.due_date ASC NULLS LAST, c.assigned_date DESC
        """, (profile_id,))
        
        results = cursor.fetchall()
        return [dict(row) for row in results]
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_chore(chore_id: int, **kwargs) -> bool:
    """
    Update chore details
    Accepts: name, due_date, notes
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Build dynamic UPDATE query
        fields = []
        values = []
        
        for key, value in kwargs.items():
            if key in ['name', 'due_date', 'notes']:
                fields.append(f"{key} = %s")
                values.append(value)
        
        if not fields:
            return False
        
        values.append(chore_id)
        query = f"UPDATE Chore SET {', '.join(fields)} WHERE chore_id = %s"
        
        cursor.execute(query, values)
        conn.commit()
        
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error updating chore: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def delete_chore(chore_id: int) -> bool:
    """
    Delete a chore (will cascade delete assignments)
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM Chore WHERE chore_id = %s", (chore_id,))
        conn.commit()
        
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error deleting chore: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()