from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import cv2
import numpy as np
from pyzbar.pyzbar import decode
from PIL import Image
import io

from ..database import get_db
from .. import models
from ..auth import get_current_active_user

router = APIRouter(
    prefix="/packages",
    tags=["qr"]
)

@router.post("/scan-qr")
async def scan_qr_code(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Читаем содержимое файла
    contents = await file.read()
    
    # Конвертируем в numpy array для OpenCV
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Декодируем QR-код
    decoded_objects = decode(img)
    
    if not decoded_objects:
        raise HTTPException(status_code=400, detail="No QR code found in image")
    
    # Получаем данные из QR-кода
    qr_data = decoded_objects[0].data.decode('utf-8')
    
    # Проверяем формат данных
    if not qr_data.startswith('tracking_number:'):
        raise HTTPException(status_code=400, detail="Invalid QR code format")
    
    # Извлекаем номер отслеживания
    tracking_number = qr_data.split(':')[1]
    
    # Проверяем существование посылки
    package = db.query(models.Package).filter(models.Package.tracking_number == tracking_number).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Проверяем права доступа
    if current_user.role != models.UserRole.ADMIN and package.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return {"tracking_number": tracking_number} 