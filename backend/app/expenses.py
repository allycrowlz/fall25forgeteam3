from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.db.pydanticmodels import *
from backend.db.expense_queries import *

router = APIRouter(prefix="/api/expenses", tags=["expenses"])

# =========================================================
# EXPENSE LISTS
# =========================================================

@router.post("/lists", status_code=201)
async def create_list(list_data: ExpenseListCreate):
    """Create a new expense list for a group"""
    try:
        return create_expense_list(list_data.group_id, list_data.list_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/groups/{group_id}/lists")
async def get_group_lists(group_id: int):
    """Get all expense lists for a group"""
    try:
        return get_group_expense_lists(group_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# EXPENSE ITEMS
# =========================================================

@router.post("/", status_code=201)
async def create_expense(expense: ExpenseItemCreate):
    """Create a new expense with splits"""
    try:
        expense_data = expense.dict(exclude={'splits'})
        splits_data = [split.dict() for split in expense.splits]
        return create_expense_item(expense_data, splits_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# IMPORTANT: Specific routes MUST come before generic /{item_id} route
@router.get("/groups/{group_id}/expenses")
async def get_group_expenses_route(
    group_id: int,
    include_deleted: bool = Query(False)
):
    """Get all expenses for a group"""
    try:
        return get_group_expenses(group_id, include_deleted)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generic routes with path parameters should come LAST
@router.get("/{item_id}")
async def get_expense(item_id: int):
    """Get expense with all splits"""
    try:
        expense = get_expense_with_splits(item_id)
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        return expense
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{item_id}")
async def delete_expense_route(item_id: int):
    """Soft delete an expense"""
    try:
        success = delete_expense(item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# SPLITS & SETTLEMENTS
# =========================================================

@router.put("/splits/{split_id}/settle")
async def settle_split_route(split_id: int):
    """Mark a split as settled"""
    try:
        result = settle_split(split_id)
        if not result:
            raise HTTPException(status_code=404, detail="Split not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{profile_id}/splits")
async def get_user_splits_route(
    profile_id: int,
    group_id: Optional[int] = Query(None),
    settled: Optional[bool] = Query(None)
):
    """Get all splits for a user, optionally filtered"""
    try:
        return get_user_splits(profile_id, group_id, settled)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# BALANCES
# =========================================================

@router.get("/users/{profile_id}/balance")
async def get_balance(
    profile_id: int,
    group_id: Optional[int] = Query(None)
):
    """Get user's total balance"""
    try:
        return get_user_balance(profile_id, group_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{profile_id}/balances")
async def get_balances_by_person(
    profile_id: int,
    group_id: Optional[int] = Query(None)
):
    """Get user's balance breakdown by person"""
    try:
        return get_user_balances_by_person(profile_id, group_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================================================
# STATISTICS
# =========================================================

@router.get("/users/{profile_id}/stats")
async def get_stats(
    profile_id: int,
    group_id: Optional[int] = Query(None),
    weeks: int = Query(4, ge=1, le=52)
):
    """Get expense statistics for charts"""
    try:
        return get_expense_stats(profile_id, group_id, weeks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))