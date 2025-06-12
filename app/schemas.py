from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .models import PackageStatus, UserRole

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PackageBase(BaseModel):
    sender_name: str
    sender_address: str
    recipient_name: str
    recipient_address: str

class PackageCreate(PackageBase):
    pass

class PackageStatusHistoryBase(BaseModel):
    status: PackageStatus
    location: str
    description: str

class PackageStatusHistoryCreate(PackageStatusHistoryBase):
    package_id: int

class PackageStatusHistory(PackageStatusHistoryBase):
    id: int
    timestamp: datetime
    package_id: int
    updated_by: int

    class Config:
        from_attributes = True

class Package(PackageBase):
    id: int
    tracking_number: str
    created_at: datetime
    current_status: PackageStatus
    status_history: List[PackageStatusHistory] = []
    created_by: int

    class Config:
        from_attributes = True 