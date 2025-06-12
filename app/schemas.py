from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .models import PackageStatus

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

    class Config:
        from_attributes = True

class Package(PackageBase):
    id: int
    tracking_number: str
    created_at: datetime
    current_status: PackageStatus
    status_history: List[PackageStatusHistory] = []

    class Config:
        from_attributes = True 