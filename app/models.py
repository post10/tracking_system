from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

class UserRole(enum.Enum):
    ADMIN = "admin"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)

class PackageStatus(enum.Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    RETURNED = "returned"

class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True)
    sender_name = Column(String)
    sender_address = Column(String)
    recipient_name = Column(String)
    recipient_address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    current_status = Column(Enum(PackageStatus), default=PackageStatus.CREATED)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Связи
    status_history = relationship("PackageStatusHistory", back_populates="package")
    creator = relationship("User")

class PackageStatusHistory(Base):
    __tablename__ = "package_status_history"

    id = Column(Integer, primary_key=True, index=True)
    package_id = Column(Integer, ForeignKey("packages.id"))
    status = Column(Enum(PackageStatus))
    location = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id"))
    
    # Связи
    package = relationship("Package", back_populates="status_history")
    updater = relationship("User") 