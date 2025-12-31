from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
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
    phone: Optional[str] = None
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v != '':
            digits = ''.join(filter(str.isdigit, v))
            if len(digits) != 10:
                raise ValueError('Phone number must be exactly 10 digits')
            return digits
        return None

class ProfileCreate(ProfileBase):
    password: str

class Profile(ProfileBase):
    profile_id: int
    date_created: datetime
    password_hash: str
    
    class Config:
        from_attributes = True

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
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is not None and v != '':
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
    group_id: Optional[int] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    event_id: int
    profile_id: int
    
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

class GroupCreate(BaseModel):
    """For creating a new group"""
    group_name: str = Field(..., max_length=100)
    group_photo: Optional[str] = Field(None, max_length=255)
    profile_id: int

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
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class Chore(BaseModel):
    """Model for a chore (without assignees)"""
    chore_id: int
    group_id: int
    name: str
    assigned_date: datetime
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class ChoreAssignee(BaseModel):
    """Model for someone assigned to a chore"""
    profile_id: int
    profile_name: str
    status: str


class ChoreWithAssignees(Chore):
    """Model for a chore with its assignees"""
    assignees: List[ChoreAssignee] = []


class ChoreAssign(BaseModel):
    """Model for assigning a chore to someone"""
    chore_id: int
    profile_id: int


class ChoreStatusUpdate(BaseModel):
    """Model for updating chore status"""
    status: str 

# ============================================
# EXPENSE LIST MODELS
# ============================================

class ExpenseListCreate(BaseModel):
    list_name: str = Field(..., max_length=100)
    group_id: int

class ExpenseList(BaseModel):
    list_id: int
    list_name: str
    group_id: int
    date_created: datetime
    date_closed: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============================================
# EXPENSE ITEM MODELS
# ============================================

class ExpenseSplitInput(BaseModel):
    """Input for creating splits - simplified"""
    profile_id: int
    amount_owed: Decimal = Field(..., decimal_places=2)

class ExpenseItemCreate(BaseModel):
    """Create a new expense"""
    item_name: str = Field(..., max_length=100)
    list_id: int
    item_total_cost: Decimal = Field(..., decimal_places=2)
    notes: Optional[str] = None
    paid_by_id: int
    is_recurring: bool = False
    recurring_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly|yearly)$")
    recurring_end_date: Optional[date] = None
    splits: List[ExpenseSplitInput]

class ExpenseItemUpdate(BaseModel):
    """Update an existing expense"""
    item_name: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

class ExpenseItem(BaseModel):
    """Full expense item"""
    item_id: int
    item_name: str
    list_id: int
    item_total_cost: Decimal
    notes: Optional[str]
    paid_by_id: int
    date_created: datetime
    is_recurring: bool
    recurring_frequency: Optional[str]
    recurring_end_date: Optional[date]
    is_deleted: bool
    
    class Config:
        from_attributes = True

# ============================================
# EXPENSE SPLIT MODELS
# ============================================

class ExpenseSplit(BaseModel):
    """A single split record"""
    split_id: int
    item_id: int
    profile_id: int
    amount_owed: Decimal
    is_settled: bool
    date_created: datetime
    date_settled: Optional[datetime]
    
    class Config:
        from_attributes = True

class ExpenseSplitWithDetails(ExpenseSplit):
    """Split with joined user and expense info"""
    profile_name: str
    profile_picture: Optional[str]
    item_name: str
    paid_by_id: int
    paid_by_name: str
    group_id: int

# ============================================
# COMBINED/RESPONSE MODELS
# ============================================

class ExpenseItemWithSplits(ExpenseItem):
    """Expense with all its splits"""
    paid_by_name: str
    splits: List[ExpenseSplitWithDetails] = []

class UserBalance(BaseModel):
    """Balance summary for a user"""
    profile_id: int
    total_owed_to_me: Decimal
    total_i_owe: Decimal
    net_balance: Decimal

class GroupBalance(BaseModel):
    """Balance for a specific person in relation to the user"""
    profile_id: int
    profile_name: str
    profile_picture: Optional[str]
    amount: Decimal

class ExpenseStats(BaseModel):
    """Statistics for expenses"""
    total_spent: Decimal
    weekly_expenses: List[Dict[str, Any]]
    monthly_expenses: List[Dict[str, Any]]


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
    items: List[ListItem] = []

class AddItem(BaseModel):
    item_name: str
    item_quantity: Optional[int] = 1
    added_by: int

class UpdateItem(BaseModel):
    item_name: Optional[str] = None
    item_quantity: Optional[int] = None
    bought: Optional[bool] = None