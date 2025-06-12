from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_active_user

router = APIRouter(
    prefix="/packages",
    tags=["packages"]
)

@router.post("/", response_model=schemas.Package)
def create_package(
    package: schemas.PackageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Генерация уникального трек-номера
    tracking_number = str(uuid.uuid4())[:8].upper()
    
    db_package = models.Package(
        tracking_number=tracking_number,
        created_by=current_user.id,
        **package.dict()
    )
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package

@router.get("/", response_model=List[schemas.Package])
def get_packages(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Админы видят все посылки, обычные пользователи - только свои
    if current_user.role == models.UserRole.ADMIN:
        packages = db.query(models.Package).offset(skip).limit(limit).all()
    else:
        packages = db.query(models.Package).filter(
            models.Package.created_by == current_user.id
        ).offset(skip).limit(limit).all()
    return packages

@router.get("/{tracking_number}", response_model=schemas.Package)
def get_package(
    tracking_number: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    package = db.query(models.Package).filter(models.Package.tracking_number == tracking_number).first()
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Проверяем права доступа
    if current_user.role != models.UserRole.ADMIN and package.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return package

@router.post("/{tracking_number}/status", response_model=schemas.PackageStatusHistory)
def update_package_status(
    tracking_number: str,
    status_update: schemas.PackageStatusHistoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    package = db.query(models.Package).filter(models.Package.tracking_number == tracking_number).first()
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Проверяем права доступа
    if current_user.role != models.UserRole.ADMIN and package.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Создаем новую запись в истории статусов
    status_history = models.PackageStatusHistory(
        package_id=package.id,
        updated_by=current_user.id,
        **status_update.dict()
    )
    
    # Обновляем текущий статус посылки
    package.current_status = status_update.status
    
    db.add(status_history)
    db.commit()
    db.refresh(status_history)
    return status_history

@router.get("/{tracking_number}/qr")
def generate_qr_code(
    tracking_number: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    package = db.query(models.Package).filter(models.Package.tracking_number == tracking_number).first()
    if package is None:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Проверяем права доступа
    if current_user.role != models.UserRole.ADMIN and package.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Создаем QR-код
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    # Формируем простой текст для QR-кода
    qr_text = f"tracking_number:{package.tracking_number}"
    print(f"Generating QR code with text: {qr_text}")
    
    qr.add_data(qr_text)
    qr.make(fit=True)
    
    # Создаем изображение
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Сохраняем в буфер
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="image/png") 