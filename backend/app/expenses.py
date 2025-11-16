import logfire
from fastapi import APIRouter, FastAPI, HTTPException, Depends
from pydantic import BaseModel
import datetime
from backend.app.auth_routes import get_current_user_from_token
from backend.db.pydanticmodels import *
from backend.db.expense_queries import (
    get_all_expenses_in_list,
    get_item_in_list,
    get_group_lists,
    delete_expense,
    create_expense
)
router = APIRouter()

try:
    logfire.configure(token="pylf_v1_us_2YgWR7VMR3yLB7JrQPnwQJt3MFQPqW1jWKPg5p2klfMj")  
    logfire.info('Instantiation')
except Exception:
    # Logfire not configured, continue without it
    pass

@router.get("/")
async def root():
    return {"message": "Hello World"}

@router.get("/recent")
async def get_recent_expenses(
    limit: int = 3,
    user_id: str = Depends(get_current_user_from_token)
):
    """
    Gets recent expenses for the current user across all their groups
    """
    from backend.db.expense_queries import get_recent_expenses_for_user
    return get_recent_expenses_for_user(int(user_id), limit)

@router.post("/expenseslists/expenses", status_code=201)
async def create_expense_endpoint(expense: ExpenseItemCreate):  # Renamed
    """
    Creates a new expense using the inputted data parsed into a PydanticCreateModel
    """
    return create_expense(expense)

@router.put("/{id}")
async def update_or_create_expense(expense: ExpenseItemCreate, id: int):
    """Not yet implemented."""
    pass

@router.delete("/{item_id}")
async def delete_expense_endpoint(item_id: int):  # Renamed
    """
    Deletes the expense with the given expense id
    """
    delete_expense(item_id)
    return {"message": f"Expense {item_id} deleted"}

@router.get("/expenseslists/{list_id}/expenses")
async def get_all_expenses_endpoint(list_id: int):  # Renamed
    """
    Gets all expenses in a given expense list
    """
    return get_all_expenses_in_list(list_id)

@router.get("/expenseslists/{list_id}/expenses/{item_id}")
async def get_expense_item(list_id: int, item_id: int):  # Renamed (was duplicate name)
    """
    Gets an expense in a given list at a given expense, 
    note: can probably remove list_id as a parameter but this is due 
    soon so I'll change it for the next commit.
    """
    return get_item_in_list(list_id, item_id)

@router.get("/groups/{group_id}/expenselists")
async def get_group_expense_lists(group_id: int):  # Renamed
    """
    Gets all expense lists for a given group id
    """
    return get_group_lists(group_id)

@router.get("/groups/{group_id}/expenseslists/{list_id}/expenses/balance")
async def total_balance(id: int):
    """Not yet implemented"""
    pass

# @router.put("/api/expenses/:id/splits/:split_id/paid")