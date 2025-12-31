# backend/db/event_queries.py

from backend.db.connection import get_connection
from datetime import datetime
from typing import Optional, List
from psycopg2.extras import RealDictCursor
from backend.db.pydanticmodels import EventCreate


def create_event(
    event: EventCreate,
    profile_ids: List[int]
) -> int:
    """Create a new event and associate it with profiles"""
    conn = get_connection()
    cursor = conn.cursor()

    print(f"🔧 create_event called:")
    print(f"   event_name: {event.event_name}")
    print(f"   group_id: {event.group_id}")
    print(f"   profile_ids: {profile_ids}")

    try:
        # Normalize datetimes (strip tzinfo to insert into TIMESTAMPTZ cleanly)
        event_datetime_start = event.event_datetime_start
        event_datetime_end = event.event_datetime_end

        if event_datetime_start.tzinfo is not None:
            event_datetime_start = event_datetime_start.replace(tzinfo=None)
        if event_datetime_end and event_datetime_end.tzinfo is not None:
            event_datetime_end = event_datetime_end.replace(tzinfo=None)

        # Insert event with group_id
        cursor.execute(
            """
            INSERT INTO Event (
                event_name,
                event_datetime_start,
                event_datetime_end,
                event_location,
                event_notes,
                group_id
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING event_id
            """,
            (
                event.event_name,
                event_datetime_start,
                event_datetime_end,
                event.event_location,
                event.event_notes,
                event.group_id,
            ),
        )

        result = cursor.fetchone()
        
        # Handle both tuple and dict results
        if isinstance(result, dict):
            event_id = result['event_id']
        else:
            event_id = result[0]
            
        print(f"✅ Event inserted with event_id: {event_id}, group_id: {event.group_id}")

        # Associate event with each profile
        for profile_id in profile_ids:
            cursor.execute(
                """
                INSERT INTO ProfileEvent (profile_id, event_id)
                VALUES (%s, %s)
                """,
                (profile_id, event_id),
            )
            print(f"   ✅ Associated profile {profile_id} with event {event_id}")

        conn.commit()

        # Verify
        cursor.execute(
            "SELECT event_id, event_name, group_id FROM Event WHERE event_id = %s",
            (event_id,),
        )
        result = cursor.fetchone()
        
        if isinstance(result, dict):
            print(f"🔍 Verification - Event {result['event_id']}: name='{result['event_name']}', group_id={result['group_id']}")
        else:
            print(f"🔍 Verification - Event {result[0]}: name='{result[1]}', group_id={result[2]}")

        return event_id

    except Exception as e:
        conn.rollback()
        print(f"❌ Error in create_event: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()


def get_events_for_profile(
    profile_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> List[dict]:
    """Get all events for a profile (across all groups)"""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        query = """
            SELECT
                e.event_id,
                e.event_name,
                e.event_datetime_start,
                e.event_datetime_end,
                e.event_location,
                e.event_notes,
                e.group_id,
                pe.profile_id
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

        query += " ORDER BY e.event_datetime_start"

        cursor.execute(query, params)
        events = cursor.fetchall()

        result: List[dict] = []
        for event in events:
            event_dict = dict(event)
            if (
                event_dict.get("event_datetime_start")
                and isinstance(event_dict["event_datetime_start"], datetime)
            ):
                event_dict["event_datetime_start"] = event_dict[
                    "event_datetime_start"
                ].strftime("%Y-%m-%dT%H:%M:%SZ")
            if (
                event_dict.get("event_datetime_end")
                and isinstance(event_dict["event_datetime_end"], datetime)
            ):
                event_dict["event_datetime_end"] = event_dict[
                    "event_datetime_end"
                ].strftime("%Y-%m-%dT%H:%M:%SZ")
            result.append(event_dict)

        return result

    finally:
        cursor.close()
        conn.close()


def get_events_for_group_members(
    group_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> List[dict]:
    """Get all events for members of a specific group (only that group's events)"""
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    print(f"🔍 get_events_for_group_members called for group_id: {group_id}", flush=True)

    try:
        query = """
            SELECT DISTINCT
                e.event_id,
                e.event_name,
                e.event_datetime_start,
                e.event_datetime_end,
                e.event_location,
                e.event_notes,
                e.group_id,
                pe.profile_id
            FROM Event e
            JOIN ProfileEvent pe ON e.event_id = pe.event_id
            WHERE e.group_id = %s
        """
        params = [group_id]

        if start_date:
            query += " AND e.event_datetime_start >= %s"
            params.append(start_date)

        if end_date:
            query += " AND e.event_datetime_start <= %s"
            params.append(end_date)

        query += " ORDER BY e.event_datetime_start"

        print(f"📊 Executing query: {query}", flush=True)
        print(f"📊 With params: {params}", flush=True)
        cursor.execute(query, params)
        events = cursor.fetchall()

        print(f"📥 Found {len(events)} raw events", flush=True)

        result: List[dict] = []
        for event in events:
            event_dict = dict(event)
            print(f"   Raw event from DB: {event_dict}", flush=True)

            # 🔒 HARD-SET group_id into the dict (even if DB / driver does something odd)
            event_dict["group_id"] = event_dict.get("group_id") or group_id

            if event_dict.get("event_datetime_start") and isinstance(
                event_dict["event_datetime_start"], datetime
            ):
                event_dict["event_datetime_start"] = event_dict[
                    "event_datetime_start"
                ].strftime("%Y-%m-%dT%H:%M:%SZ")

            if event_dict.get("event_datetime_end") and isinstance(
                event_dict["event_datetime_end"], datetime
            ):
                event_dict["event_datetime_end"] = event_dict[
                    "event_datetime_end"
                ].strftime("%Y-%m-%dT%H:%M:%SZ")

            print(f"   Processed event to return: {event_dict}", flush=True)
            result.append(event_dict)

        print(f"📤 Returning {len(result)} events", flush=True)
        return result

    finally:
        cursor.close()
        conn.close()


def delete_event(event_id: int) -> bool:
    """Delete an event and its profile associations"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT event_id FROM Event WHERE event_id = %s",
            (event_id,),
        )
        event = cursor.fetchone()

        if not event:
            print(f"❌ Event {event_id} not found in database")
            conn.rollback()
            return False

        print(f"✅ Found event {event_id}, proceeding to delete")

        cursor.execute(
            "DELETE FROM ProfileEvent WHERE event_id = %s",
            (event_id,),
        )
        pe_deleted = cursor.rowcount
        print(f"🗑️ Deleted {pe_deleted} ProfileEvent entries")

        cursor.execute(
            "DELETE FROM Event WHERE event_id = %s",
            (event_id,),
        )
        event_deleted = cursor.rowcount
        print(f"🗑️ Deleted {event_deleted} Event entries")

        conn.commit()
        return event_deleted > 0

    except Exception as e:
        print(f"❌ Error deleting event {event_id}: {e}")
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()