from pydantic import BaseModel
from datetime import datetime

# --- User Validation ---
class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Transaction Validation ---
class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    date: datetime
    owner_id: int

    class Config:
        from_attributes = True