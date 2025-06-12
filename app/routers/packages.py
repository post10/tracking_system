from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/packages",
    tags=["packages"]
)

@router.post("/", response_model=schemas.Package)
def create_package(package: schemas.PackageCreate, db: Session = Depends(get_db)):
    # Генерация уникального трек-номера
    tracking_number = str(uuid.uuid4())[:8].upper()
    
    db_package = models.Package(
        tracking_number=tracking_number,
        **package.dict()
    )
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package

@router.get("/", response_model=List[schemas.Package])
def get_packages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    packages = db.query(models.Package).offset(skip).limit(limit).all()
    return packages

@router.get("/{tracking_number}", response_model=schemas.Package)
def get_package(tracking_number: str, db: Session = Depends(get_db)):
    package = db.query(models.Package).filter(models.Package.tracking_number == tracking_number).first()
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")
    return package

@router.post("/{tracking_number}/status", response_model=schemas.PackageStatusHistory)
def update_package_status(
    tracking_number: str,
    status_update: schemas.PackageStatusHistoryCreate,
    db: Session = Depends(get_db)
):
    package = db.query(models.Package).filter(models.Package.tracking_number == tracking_number).first()
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Создаем новую запись в истории статусов
    status_history = models.PackageStatusHistory(
        package_id=package.id,
        **status_update.dict()
    )
    
    # Обновляем текущий статус посылки
    package.current_status = status_update.status
    
    db.add(status_history)
    db.commit()
    db.refresh(status_history)
    return status_history 