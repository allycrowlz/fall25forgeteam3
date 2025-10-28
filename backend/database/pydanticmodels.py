from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskItemCreate(BaseModel):
    list_id: int
    roommate_id: int
    description: str
    completed: bool = False

class TaskItem(BaseModel):
    id: int
    list_id: int
    roommate_id: int
    description: str
    completed: bool
    created_at: datetime