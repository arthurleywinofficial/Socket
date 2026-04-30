from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/sensors", tags=["Sensör Yönetimi"])

# GÜVENLİK: Eğer kişi admin değilse ve `can_manage_sensors` yetkisi FALSE ise silemez/ekleyemez.
def require_sensor_manager(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin" and not current_user.can_manage_sensors:
        raise HTTPException(status_code=403, detail="Donanımları sisteme kaydetme, silme veya eşik değiştirme yetkiniz YOKTUR!")
    return current_user

@router.get("/", response_model=List[schemas.SensorResponse], summary="Sensörleri Listele", description="Sistemdeki tüm kayıtlı sensörleri ve güncel eşik değerlerini getirir.")
def list_sensors(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        return db.query(models.Sensor).all()
    except Exception as e:
        print(f"[Sensors Query Error]: {e}")
        return []

@router.post("/", response_model=schemas.SensorResponse, summary="Yeni Sensör Ekle", description="Sisteme yeni bir IoT sensörü kaydeder (Sadece Admin veya Yetkili personel).")
def create_sensor(sensor: schemas.SensorCreate, db: Session = Depends(get_db), manager: models.User = Depends(require_sensor_manager)):
    db_sensor = db.query(models.Sensor).filter(models.Sensor.name == sensor.name).first()
    if db_sensor:
        raise HTTPException(status_code=400, detail="Bu benzersiz isme sahip sensör zaten sistemde var!")
    new_sensor = models.Sensor(**sensor.model_dump())
    db.add(new_sensor)
    db.commit()
    db.refresh(new_sensor)
    return new_sensor

@router.put("/{sensor_id}", response_model=schemas.SensorResponse, summary="Sensör Güncelle", description="Belirli bir sensörün alarm eşik değerlerini veya bilgilerini günceller.")
def update_sensor_thresholds(sensor_id: int, updates: schemas.SensorUpdate, db: Session = Depends(get_db), manager: models.User = Depends(require_sensor_manager)):
    sensor = db.query(models.Sensor).filter(models.Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensör bulunamadı")
    
    update_data = updates.model_dump(exclude_unset=True) # Sadece yollanan alanları günceller
    for key, value in update_data.items():
        setattr(sensor, key, value)
        
    db.commit()
    db.refresh(sensor)
    return sensor

@router.delete("/{sensor_id}", summary="Sensörü Sil", description="Sensörü sistemden kalıcı olarak kaldırır.")
def delete_sensor(sensor_id: int, db: Session = Depends(get_db), manager: models.User = Depends(require_sensor_manager)):
    sensor = db.query(models.Sensor).filter(models.Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensör bulunamadı")
        
    db.delete(sensor)
    db.commit()
    return {"status": "success", "message": "Sensör sistemden kalıcı olarak kaldırıldı."}
