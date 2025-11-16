from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from backend.app.auth_routes import get_current_user_from_token
from backend.db.event_queries import (
    create_event,
    get_events_for_profile,
    delete_event,
    get_events_for_group_members
)

router = APIRouter()

class EventCreate(BaseModel):
    event_name: str
    event_datetime_start: datetime
    event_datetime_end: Optional[datetime] = None
    event_location: Optional[str] = None
    event_notes: Optional[str] = None
    group_id: Optional[int] = None  # If provided, invite all group members

@router.post("/events", status_code=201)
async def create_event_endpoint(
    event: EventCreate,
    user_id: str = Depends(get_current_user_from_token)
):
    """Create a new event"""
    try:
        # Get profile IDs to invite
        profile_ids = [int(user_id)]
        
        # If group_id provided, add all group members
        if event.group_id:
            from backend.db.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT profile_id FROM groupprofile WHERE group_id = %s
            """, (event.group_id,))
            group_members = cursor.fetchall()
            profile_ids = list(set([int(user_id)] + [m[0] for m in group_members]))
            cursor.close()
            conn.close()
        
        event_id = create_event(
            event_name=event.event_name,
            event_datetime_start=event.event_datetime_start,
            event_datetime_end=event.event_datetime_end,
            event_location=event.event_location,
            event_notes=event.event_notes,
            profile_ids=profile_ids
        )
        
        return {"event_id": event_id, "message": "Event created successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
async def get_user_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user_from_token)
):
    """Get all events for the current user"""
    try:
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        events = get_events_for_profile(int(user_id), start_dt, end_dt)
        return events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/groups/{group_id}/events")
async def get_group_events(
    group_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user_from_token)
):
    """Get all events for a group"""
    try:
        start_dt = datetime.fromisoformat(start_date) if start_date else None
        end_dt = datetime.fromisoformat(end_date) if end_date else None
        
        events = get_events_for_group_members(group_id, start_dt, end_dt)
        return events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}", status_code=200)
async def delete_event_endpoint(
    event_id: int,
    user_id: str = Depends(get_current_user_from_token)
):
    """Delete an event"""
    try:
        success = delete_event(event_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))