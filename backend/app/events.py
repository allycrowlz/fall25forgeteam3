# backend/app/event_routes.py

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional, List

from backend.app.auth_routes import get_current_user_from_token
from backend.db.event_queries import (
    create_event,
    get_events_for_profile,
    delete_event,
    get_events_for_group_members,
)
from backend.db.pydanticmodels import EventCreate

router = APIRouter()


@router.post("/events", status_code=201)
async def create_event_endpoint(
    event: EventCreate,
    user_id: str = Depends(get_current_user_from_token),
):
    """Create a new event"""
    print("=" * 80)
    print("📝 CREATE EVENT REQUEST")
    print(f"   User ID: {user_id}")
    print(f"   Event Name: {event.event_name}")
    print(f"   Group ID: {event.group_id}")
    print("=" * 80)

    try:
        profile_ids: List[int] = [int(user_id)]

        # If group_id is provided, include all group members
        if event.group_id:
            from backend.db.connection import get_connection

            conn = get_connection()
            cursor = conn.cursor()
            try:
                cursor.execute(
                    """
                    SELECT profile_id FROM groupprofile WHERE group_id = %s
                    """,
                    (event.group_id,),
                )
                group_members = cursor.fetchall()
                
                # Handle both tuple and dict results (RealDictRow)
                if group_members and isinstance(group_members[0], dict):
                    all_profile_ids = [row['profile_id'] for row in group_members]
                else:
                    all_profile_ids = [row[0] for row in group_members]
                
                profile_ids = list(set([int(user_id)] + all_profile_ids))
                print(f"👥 Group members: {all_profile_ids}")
                print(f"📋 All profile IDs for event: {profile_ids}")
            finally:
                cursor.close()
                conn.close()

        print(f"💾 Creating event with group_id: {event.group_id}")
        event_id = create_event(event=event, profile_ids=profile_ids)

        print(f"✅ Event created with ID: {event_id}")

        return {
            "event_id": event_id,
            "group_id": event.group_id,
            "message": "Event created successfully",
        }
    except Exception as e:
        print(f"❌ Error creating event: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
async def get_user_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user_from_token),
):
    """Get all events for the current user (across all groups)"""
    try:
        start_dt = (
            datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            if start_date
            else None
        )
        end_dt = (
            datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            if end_date
            else None
        )

        events = get_events_for_profile(int(user_id), start_dt, end_dt)
        return events
    except Exception as e:
        print(f"Error getting user events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/groups/{group_id}/events")
async def get_group_events(
    group_id: int,
    start: str,
    end: str,
    profile_id: int,
):
    """Get all events for a specific group (only that group's events)"""
    print("=" * 80, flush=True)
    print("🔍 GET GROUP EVENTS REQUEST:", flush=True)
    print(f"   group_id: {group_id}", flush=True)
    print(f"   profile_id: {profile_id}", flush=True)
    print(f"   start: {start}", flush=True)
    print(f"   end: {end}", flush=True)
    print("=" * 80, flush=True)

    try:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))

        print("📅 Parsed dates:", flush=True)
        print(f"   start_dt: {start_dt}", flush=True)
        print(f"   end_dt: {end_dt}", flush=True)

        # ✅ Verify the user is in this group
        from backend.db.connection import get_connection

        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                SELECT profile_id FROM groupprofile
                WHERE group_id = %s AND profile_id = %s
                """,
                (group_id, profile_id),
            )

            if not cursor.fetchone():
                print(
                    f"❌ User {profile_id} not in group {group_id}",
                    flush=True,
                )
                raise HTTPException(
                    status_code=403, detail="Not a member of this group"
                )

            print(
                f"✅ User {profile_id} is member of group {group_id}",
                flush=True,
            )
        finally:
            cursor.close()
            conn.close()

        # ✅ Get ALL events for this profile, then filter by group_id
        print("🔍 Fetching events for profile (all groups)...", flush=True)
        all_events = get_events_for_profile(profile_id, start_dt, end_dt)
        print(f"📦 Got {len(all_events)} events for profile {profile_id}", flush=True)

        # 🔒 Only keep events that belong to this group
        group_events = [
            ev
            for ev in all_events
            if ev.get("group_id") == group_id
        ]

        print(f"📤 Returning {len(group_events)} events for group {group_id}", flush=True)
        for ev in group_events:
            print(f"   Event {ev['event_id']} → group_id={ev.get('group_id')}", flush=True)

        return group_events

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting group events: {e}", flush=True)
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/events/{event_id}", status_code=200)
async def delete_event_endpoint(
    event_id: int,
    user_id: str = Depends(get_current_user_from_token),
):
    """Delete an event"""
    print("=" * 80)
    print(f"🔥 DELETE ENDPOINT HIT - event_id: {event_id}, user_id: {user_id}")
    print("=" * 80)

    try:
        success = delete_event(event_id)

        if not success:
            print(f"❌ Delete failed for event {event_id}")
            raise HTTPException(status_code=404, detail="Event not found")

        print(f"✅ Successfully deleted event {event_id}")
        return {"message": "Event deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception while deleting event {event_id}: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))