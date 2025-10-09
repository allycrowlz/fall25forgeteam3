from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

# ===========================================
# PROFILE AND EVENT MODELS
# ===========================================

class ProfileBase(BaseModel):
    profile_name: str = Field(..., max_length=100)
    email: EmailStr
    picture: Optional[str] = Field(None, max_length=255)
    birthday: Optional[date] = None

class ProfileCreate(ProfileBase):
    password: str  # Plain password (will be hashed before storing)

class Profile(ProfileBase):
    profile_id: int
    date_created: datetime
    password_hash: str
    
    class Config:
        from_attributes = True  # Allows Pydantic to work with DB rows


class EventBase(BaseModel):
    event_name: str = Field(..., max_length=100)
    event_datetime_start: datetime
    event_datetime_end: Optional[datetime] = None
    event_location: Optional[str] = Field(None, max_length=255)
    event_notes: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    event_id: int
    
    class Config:
        from_attributes = True


class ProfileEventBase(BaseModel):
    profile_id: int
    event_id: int

class ProfileEventCreate(ProfileEventBase):
    pass

class ProfileEvent(ProfileEventBase):
    class Config:
        from_attributes = True


# ============================================
# GROUP MODELS
# ============================================

class GroupBase(BaseModel):
    group_name: str = Field(..., max_length=100)
    group_photo: Optional[str] = Field(None, max_length=255)
    join_code: str = Field(..., max_length=20)

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    group_id: int
    date_created: datetime
    
    class Config:
        from_attributes = True


class GroupProfileBase(BaseModel):
    group_id: int
    profile_id: int
    role: str = Field(default="member", pattern="^(admin|member)$")

class GroupProfileCreate(GroupProfileBase):
    pass

class GroupProfile(GroupProfileBase):
    joined_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# CHORE MODELS
# ============================================

class ChoreBase(BaseModel):
    group_id: int
    name: str = Field(..., max_length=100)
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class ChoreCreate(ChoreBase):
    pass

class Chore(ChoreBase):
    chore_id: int
    assigned_date: datetime
    
    class Config:
        from_attributes = True


class ChoreAssigneeBase(BaseModel):
    profile_id: int
    chore_id: int
    individual_status: str = Field(default="pending", pattern="^(pending|completed)$")

class ChoreAssigneeCreate(ChoreAssigneeBase):
    pass

class ChoreAssignee(ChoreAssigneeBase):
    class Config:
        from_attributes = True


# ============================================
# EXPENSE MODELS
# ============================================

class ExpenseListBase(BaseModel):
    list_name: str = Field(..., max_length=100)
    group_id: int
    date_closed: Optional[datetime] = None

class ExpenseListCreate(ExpenseListBase):
    pass

class ExpenseList(ExpenseListBase):
    list_id: int
    date_created: datetime
    
    class Config:
        from_attributes = True


class ExpenseItemBase(BaseModel):
    item_name: str = Field(..., max_length=100)
    list_id: int
    item_total_cost: Decimal = Field(..., decimal_places=2)
    item_quantity: int = Field(default=1)
    notes: Optional[str] = None
    bought_by_id: int

class ExpenseItemCreate(ExpenseItemBase):
    pass

class ExpenseItem(ExpenseItemBase):
    item_id: int
    date_bought: datetime
    
    class Config:
        from_attributes = True


class ExpenseSplitBase(BaseModel):
    item_id: int
    profile_id: int
    amount_owed: Decimal = Field(..., decimal_places=2)
    is_active: bool = Field(default=True)

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplit(ExpenseSplitBase):
    split_id: int
    date_created: datetime
    
    class Config:
        from_attributes = True