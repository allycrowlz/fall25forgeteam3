from pydantic import BaseModel, EmailStr, Field, field_validator
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
    birthday: Optional[str] = None
    phone: Optional[str] = None  # ADD THIS LINE
    
    @field_validator('phone')  # ADD THIS VALIDATOR
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v != '':
            # Remove any non-digit characters
            digits = ''.join(filter(str.isdigit, v))
            if len(digits) != 10:
                raise ValueError('Phone number must be exactly 10 digits')
            return digits
        return None

class ProfileCreate(ProfileBase):
    password: str  # Plain password (will be hashed before storing)

class Profile(ProfileBase):
    profile_id: int
    date_created: datetime
    password_hash: str
    
    class Config:
        from_attributes = True  # Allows Pydantic to work with DB rows

# ... (EventBase, EventCreate, Event, ProfileEventBase, etc. stay the same)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    profile_id: int
    profile_name: str
    email: str
    picture: Optional[str]
    birthday: Optional[str]
    phone: Optional[str] = None 
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    profile_name: Optional[str] = Field(None, max_length=100)
    picture: Optional[str] = Field(None, max_length=255)
    birthday: Optional[str] = None
    phone: Optional[str] = None
    
    @field_validator('phone')  # ADD THIS VALIDATOR
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v != '':
            # Remove any non-digit characters
            digits = ''.join(filter(str.isdigit, v))
            if len(digits) != 10:
                raise ValueError('Phone number must be exactly 10 digits')
            return digits
        return None


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

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================================
# GROUP MODELS
# ============================================

class GroupBase(BaseModel):
    group_name: str = Field(..., max_length=100)
    group_photo: Optional[str] = Field(None, max_length=255)

class GroupCreate(BaseModel):
    """For creating a new group"""
    group_name: str = Field(..., max_length=100)
    group_photo: Optional[str] = Field(None, max_length=255)
    profile_id: int  # Creator's profile ID

class GroupUpdate(BaseModel):
    """For updating group details"""
    group_name: str = Field(..., max_length=100)
    group_photo: Optional[str] = Field(None, max_length=255)

class Group(GroupBase):
    group_id: int
    date_created: datetime
    join_code: str
    
    class Config:
        from_attributes = True

class GroupMember(BaseModel):
    """For group member information"""
    profile_id: int
    profile_name: str
    email: str
    picture: Optional[str]
    role: str
    is_creator: bool

class JoinGroup(BaseModel):
    """For joining a group"""
    join_code: str
    profile_id: int

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

class ChoreCreate(BaseModel):
    """Model for creating a new chore"""
    group_id: int
    name: str
    category: Optional[str] = None  # e.g., "Kitchen", "Bathroom", "General"
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class Chore(BaseModel):
    """Model for a chore (without assignees)"""
    chore_id: int
    group_id: int
    name: str
    category: Optional[str] = None
    assigned_date: datetime
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class ChoreAssignee(BaseModel):
    """Model for someone assigned to a chore"""
    profile_id: int
    profile_name: str
    status: str  # 'pending' or 'completed'


class ChoreWithAssignees(Chore):
    """Model for a chore with its assignees"""
    assignees: list[ChoreAssignee] = []


class ChoreAssign(BaseModel):
    """Model for assigning a chore to someone"""
    profile_id: int


class ChoreStatusUpdate(BaseModel):
    """Model for updating chore status"""
    status: str 


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


# ============================================
# SHOPPING LIST MODELS
# ============================================
class ShoppingList(BaseModel):
    list_name: str
    list_id: int
    date_created: datetime
    date_closed: Optional[datetime] = None
    group_id: int
class ListItem(BaseModel):
    item_name: str
    item_id: int
    list_id: int
    item_quantity: Optional[int] = 1
    added_by: int
    date_added: datetime
    bought: bool
class CreateShoppingList(BaseModel):
    list_name: str
class ShoppingListWithItems(BaseModel):
    list_id: int
    list_name: str
    date_created: datetime
    date_closed: Optional[datetime] = None
    group_id: int
    items: list[ListItem] = []
class AddItem(BaseModel):
    item_name: str
    item_quantity: Optional[int] = 1
    added_by: int
class UpdateItem(BaseModel):
    item_name: Optional[str] = None
    item_quantity: Optional[int] = None
    bought: Optional[bool] = None
