import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

import logfire
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database.pydanticmodels import *
from database import task_queries

# RUN: fastapi dev backend/app/tasks.py for development server
app = FastAPI()

logfire.configure(token="pylf_v1_us_2YgWR7VMR3yLB7JrQPnwQJt3MFQPqW1jWKPg5p2klfMj")  
logfire.info('Instantiation')

@app.get("/")
async def root():
    return {"message": "HomeBase Tasks API"}

@app.post("/api/tasklists/tasks", status_code=201)
async def create_task(task: TaskItemCreate):
    """
    Creates a new task using the inputted data parsed into a PydanticCreateModel
    """
    return task_queries.create_task(task)

@app.put("/api/tasks/{id}")
async def update_or_create_task(task: TaskItemCreate, id: int):
    """Not yet implemented."""
    pass

@app.delete("/api/tasks/{item_id}")
async def delete_task(item_id: int):
    """
    Deletes the task with the given task id
    """
    task_queries.delete_task(item_id)
    return {"message": f"Task {item_id} deleted"}

@app.get("/api/tasklists/{list_id}/tasks")
async def get_all_tasks_in_list(list_id: int):
    """
    Gets all tasks in a given task list
    """
    return task_queries.get_all_tasks_in_list(list_id)

@app.get("/api/tasklists/{list_id}/tasks/{item_id}")
async def get_task_in_list(list_id: int, item_id: int):
    """
    Gets a task in a given list at a given task id, 
    note: can probably remove list_id as a parameter but this is due 
    soon so I'll change it for the next commit.
    """
    return task_queries.get_item_in_list(list_id, item_id)

@app.patch("/api/tasks/{task_id}/toggle")
async def toggle_task_completion(task_id: int):
    """
    Toggles the completion status of a task
    """
    return task_queries.toggle_task_completion(task_id)

@app.get("/api/groups/{group_id}/tasklists")
async def get_group_task_lists(group_id: int):
    """
    Gets all task lists for a given group id
    """
    return task_queries.get_group_task_lists(group_id)

@app.get("/api/groups/{group_id}/tasklists/{list_id}/tasks/roommate/{roommate_id}")
async def get_tasks_by_roommate(group_id: int, list_id: int, roommate_id: int):
    """
    Gets all tasks assigned to a specific roommate in a task list
    """
    return task_queries.get_tasks_by_roommate(list_id, roommate_id)