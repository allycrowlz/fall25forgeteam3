from backend.db.connection import get_connection
from datetime import datetime
from typing import Optional, List, Dict

def create_event(
    event_name: str,
    event_datetime_start: datetime,
    event_datetime_end: Optional[datetime] = None,
    event_location: Optional[str] = None,
    event_notes: Optional[str] = None,
    profile_ids: List[int] = []
) -> int:
    """
    Create a new event and optionally assign to profiles
    Returns the event_id
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Insert event
        cursor.execute("""
            INSERT INTO Event (event_name, event_datetime_start, event_datetime_end, event_location, event_notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING event_id
        """, (event_name, event_datetime_start, event_datetime_end, event_location, event_notes))
        
        event_id = cursor.fetchone()[0]
        
        # Assign to profiles
        for profile_id in profile_ids:
            cursor.execute("""
                INSERT INTO ProfileEvent (profile_id, event_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (profile_id, event_id))
        
        conn.commit()
        return event_id
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error creating event: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_events_for_profile(profile_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict]:
    """
    Get all events for a specific profile, optionally filtered by date range
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                e.event_id,
                e.event_name,
                e.event_datetime_start,
                e.event_datetime_end,
                e.event_location,
                e.event_notes
            FROM Event e
            JOIN ProfileEvent pe ON e.event_id = pe.event_id
            WHERE pe.profile_id = %s
        """
        params = [profile_id]
        
        if start_date:
            query += " AND e.event_datetime_start >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND e.event_datetime_start <= %s"
            params.append(end_date)
        
        query += " ORDER BY e.event_datetime_start ASC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return [
            {
                "event_id": row[0],
                "event_name": row[1],
                "event_datetime_start": (row[2].isoformat() + 'Z') if row[2] else None,
                "event_datetime_end": (row[3].isoformat() + 'Z') if row[3] else None,
                "event_location": row[4],
                "event_notes": row[5]
            }
            for row in results
        ]
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def delete_event(event_id: int) -> bool:
    """
    Delete an event (will cascade delete ProfileEvent entries)
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM Event WHERE event_id = %s", (event_id,))
        conn.commit()
        
        return cursor.rowcount > 0
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise Exception(f"Error deleting event: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_events_for_group_members(group_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict]:
    """
    Get all events for members of a group
    """
    conn = None
    cursor = None
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT DISTINCT
                e.event_id,
                e.event_name,
                e.event_datetime_start,
                e.event_datetime_end,
                e.event_location,
                e.event_notes
            FROM Event e
            JOIN ProfileEvent pe ON e.event_id = pe.event_id
            JOIN groupprofile gp ON pe.profile_id = gp.profile_id
            WHERE gp.group_id = %s
        """
        params = [group_id]
        
        if start_date:
            query += " AND e.event_datetime_start >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND e.event_datetime_start <= %s"
            params.append(end_date)
        
        query += " ORDER BY e.event_datetime_start ASC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        return [
            {
                "event_id": row[0],
                "event_name": row[1],
                "event_datetime_start": (row[2].isoformat() + 'Z') if row[2] else None,
                "event_datetime_end": (row[3].isoformat() + 'Z') if row[3] else None,
                "event_location": row[4],
                "event_notes": row[5]
            }
            for row in results
        ]
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()