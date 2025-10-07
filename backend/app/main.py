import logfire
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import datetime


# RUN: fastapi dev backend/app/main.py
app = FastAPI()



class Expense(BaseModel):
    item_name: str
    price: float
    category: str
    date: int
    buyer_firstname: str
    buyer_lastname: str
    buyer_id: int
    group_id: int
    id: int

expenses: list[Expense] = []

logfire.configure()  
logfire.info('Instantiation')

@app.get("/")
async def root():
    logfire.info("Hello Karim")
    return {"message": "Hello World"}

@app.post("/api/expenses", status_code=201)
async def create_expense(expense: Expense):
    #logfire.configure()
    expenses.append(expense)
    logfire.info(expense.item_name)
    return {"Item received": expense.item_name}

@app.get("/api/groups/{group_id}/expenses")
async def get_expenses_for_groupid(group_id: int):
    #response = query database: select expense from group_expenses where id {id}
    response = []
    for i in range(len(expenses)):
        if expenses[i].group_id == group_id:
            response.append(expenses[i])
    
    return {f"Group {group_id} expenses": len(expenses)}


@app.put("/api/expenses/{id}")
async def update_or_create_expense(expense: Expense, id: int):
    for i in range(len(expenses)):
        if expenses[i].id == id:
            expenses[i] = expense
            return {"message" : f"Expense {id} updated"}
    
    expenses.append(expense)
    return {"message" : f"New expense {id} added"}


@app.delete("/api/expenses/{id}")
async def delete_expense(id: int):
    for exp in expenses:
        if exp.id == id:
            expenses.remove(exp)
            return {"message": f"Expense {id} deleted"}
    raise HTTPException(status_code=404, detail="Expense not found")


@app.get("/api/groups/{id}/expenses/balance")
async def total_balance(id: int):
    balance = 0
    if id not in map(expenses_to_group_id, expenses):
        raise HTTPException(status_code=404, detail="No expenses associated with group")

    for i in range(len(expenses)):
        logfire.info(str(len(expenses)))
        logfire.info(str(balance))
        if expenses[i].group_id == id:
            balance += expenses[i].price
    return {f"Group {id} balance": balance}

# @app.put("/api/expenses/:id/splits/:split_id/paid")

def expenses_to_group_id(expense: Expense):
    print(expense.group_id)
    return expense.group_id
