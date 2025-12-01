from fastapi import APIRouter, HTTPException
from typing import List
from backend.db.pydanticmodels import (
    ChoreCreate, 
    Chore, 
    ChoreWithAssignees, 
    ChoreAssign, 
    ChoreStatusUpdate
)
from backend.db.chores_queries import (
    create_chore, get_chore_by_id, get_chores_for_group,
    get_chores_with_assignees, assign_chore_to_profile,
    unassign_chore_from_profile, update_chore_status,
    toggle_chore_status, get_chores_for_profile, update_chore, delete_chore
)

# Create router instead of FastAPI app
router = APIRouter()

# ==================== CHORE MANAGEMENT ====================

@router.post("/chores", status_code=201, response_model=Chore)
async def create_chore_endpoint(chore: ChoreCreate):  # Renamed to avoid conflict
    """
    Create a new chore for a group
    """
    try:
        chore_id = create_chore(  # Changed from chore_queries.create_chore
            group_id=chore.group_id,
            name=chore.name,
            due_date=chore.due_date,
            notes=chore.notes
        )
        
        created_chore = get_chore_by_id(chore_id)  # Changed
        
        if not created_chore:
            raise HTTPException(status_code=500, detail="Failed to retrieve created chore")
        
        return created_chore
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating chore: {str(e)}")


@router.get("/chores/{chore_id}", response_model=Chore)
async def get_chore(chore_id: int):
    """
    Get a specific chore by ID
    """
    try:
        chore = get_chore_by_id(chore_id)  # Changed
        
        if not chore:
            raise HTTPException(status_code=404, detail=f"Chore {chore_id} not found")
        
        return chore
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chore: {str(e)}")


@router.get("/groups/{group_id}/chores", response_model=List[Chore])
async def get_group_chores(group_id: int):
    """
    Get all chores for a specific group
    """
    try:
        chores = get_chores_for_group(group_id)  # Changed
        return chores
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chores: {str(e)}")


@router.get("/groups/{group_id}/chores/detailed", response_model=List[ChoreWithAssignees])
async def get_group_chores_with_assignees(group_id: int):
    """
    Get all chores for a group WITH assignee information
    """
    try:
        chores = get_chores_with_assignees(group_id)  # Changed
        return chores
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chores: {str(e)}")


@router.get("/profiles/{profile_id}/chores")
async def get_profile_chores(profile_id: int):
    """
    Get all chores assigned to a specific profile/roommate
    """
    try:
        chores = get_chores_for_profile(profile_id)  # Changed
        return chores
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chores: {str(e)}")


@router.put("/chores/{chore_id}", response_model=Chore)
async def update_chore_endpoint(chore_id: int, chore_update: ChoreCreate):  # Renamed
    """
    Update chore details (name, due_date, notes)
    """
    try:
        success = update_chore(  # Changed
            chore_id=chore_id,
            name=chore_update.name,
            due_date=chore_update.due_date,
            notes=chore_update.notes
        )
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Chore {chore_id} not found")
        
        updated_chore = get_chore_by_id(chore_id)  # Changed
        return updated_chore
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating chore: {str(e)}")


@router.delete("/chores/{chore_id}", status_code=200)
async def delete_chore_endpoint(chore_id: int):  # Renamed
    """
    Delete a chore (cascades to all assignments)
    """
    try:
        success = delete_chore(chore_id)  # Changed
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Chore {chore_id} not found")
        
        return {"message": f"Chore {chore_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chore: {str(e)}")


# ==================== CHORE ASSIGNMENT ====================

@router.post("/chores/{chore_id}/assign", status_code=201)
async def assign_chore(chore_id: int, assignment: ChoreAssign):
    """
    Assign a chore to a roommate/profile
    Body: { "chore_id": 1, "profile_id": 5 }
    """
    try:
        success = assign_chore_to_profile(  # Changed
            chore_id=chore_id,
            profile_id=assignment.profile_id
        )
        
        if not success:
            return {"message": "Profile already assigned to this chore", "already_assigned": True}
        
        return {
            "message": f"Chore {chore_id} assigned to profile {assignment.profile_id}",
            "chore_id": chore_id,
            "profile_id": assignment.profile_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning chore: {str(e)}")


@router.delete("/chores/{chore_id}/unassign/{profile_id}", status_code=200)
async def unassign_chore(chore_id: int, profile_id: int):
    """
    Remove a roommate from a chore assignment
    """
    try:
        success = unassign_chore_from_profile(  # Changed
            chore_id=chore_id,
            profile_id=profile_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        return {"message": f"Profile {profile_id} unassigned from chore {chore_id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unassigning chore: {str(e)}")


# ==================== CHORE STATUS ====================

@router.patch("/chores/{chore_id}/status/{profile_id}")
async def update_chore_status_endpoint(chore_id: int, profile_id: int, status_update: ChoreStatusUpdate):  # Renamed
    """
    Update the completion status of a chore for a specific profile
    Body: { "status": "completed" } or { "status": "pending" }
    """
    try:
        if status_update.status not in ['pending', 'completed']:
            raise HTTPException(
                status_code=400, 
                detail="Status must be 'pending' or 'completed'"
            )
        
        success = update_chore_status(  # Changed
            chore_id=chore_id,
            profile_id=profile_id,
            status=status_update.status
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Chore assignment not found")
        
        return {
            "message": f"Status updated to '{status_update.status}'",
            "chore_id": chore_id,
            "profile_id": profile_id,
            "status": status_update.status
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating status: {str(e)}")


@router.patch("/chores/{chore_id}/toggle/{profile_id}")
async def toggle_chore_status_endpoint(chore_id: int, profile_id: int):  # Renamed
    """
    Toggle chore status between pending and completed
    Easier than specifying the status explicitly
    """
    try:
        new_status = toggle_chore_status(  # Changed
            chore_id=chore_id,
            profile_id=profile_id
        )
        
        if not new_status:
            raise HTTPException(status_code=404, detail="Chore assignment not found")
        
        return {
            "message": f"Status toggled successfully",
            "chore_id": chore_id,
            "profile_id": profile_id,
            "new_status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error toggling status: {str(e)}")