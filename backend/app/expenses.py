import logfire
from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel
import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from database.pydanticmodels import *
from database import expense_queries

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

@router.post("/api/expenseslists/expenses", status_code=201)
async def create_expense(expense: ExpenseItemCreate):
    """
    Creates a new expense using the inputted data parsed into a PydanticCreateModel
    """
    return expense_queries.create_expense(expense)


@router.put("/api/expenses/{id}")
async def update_or_create_expense(expense: ExpenseItemCreate, id: int):
    """Not yet implemented."""


@router.delete("/api/expenses/{item_id}")
async def delete_expense(item_id: int):
    """
    Deletes the expense with the given expense id
    """
    expense_queries.delete_expense(item_id)
    return {"message": f"Expense {item_id} deleted"}
    
@router.get("/api/expenseslists/{list_id}/expenses")
async def get_all_expenses_in_list(list_id: int):
    """
    Gets all expenses in a given expense list
    """
    return expense_queries.get_all_expenses_in_list(list_id)

@router.get("/api/expenseslists/{list_id}/expenses/{item_id}")
async def get_all_expenses_in_list(list_id: int, item_id: int):
    """
    Gets an expense in a given list at a given expense, 
    note: can probably remove list_id as a parameter but this is due 
    soon so I'll change it for the next commit.
    """
    return expense_queries.get_item_in_list(list_id, item_id)

@router.get("/api/groups/{group_id}/expenselists")
async def get_group_lists(group_id: int):
    """
    Gets all expense lists for a given group id
    """
    return expense_queries.get_group_lists(group_id)

@router.get("/api/groups/{group_id}/expenseslists/{list_id}/expenses/balance")
async def total_balance(id: int):
    """Not yet implemented"""

# @router.put("/api/expenses/:id/splits/:split_id/paid")
