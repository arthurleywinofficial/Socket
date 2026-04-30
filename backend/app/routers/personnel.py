from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/personnel", tags=["Personel ve Güvenlik"])

@router.get("/tracking", response_model=List[schemas.PersonnelTrackingReport], summary="Personel Takip Paneli", description="Tesis içindeki personelin son konumlarını ve güvenlik (Lone Worker) durumlarını listeler.")
def tracking_dashboard(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    report = []
    now = datetime.utcnow()
    
    for u in users:
        status = "safe"
        if u.last_seen:
            diff = (now - u.last_seen).total_seconds()
            # Kural: 10 dk (600 sn) hareketsizlikte Lone Worker alarmı ver, hızlı test için staj projesinde 60 saniye tutulur:
            if diff > 60: 
                status = "lone_worker_danger"
                
        report.append({
            "user": u,
            "status": status
        })
    return report

@router.post("/evacuation/trigger", summary="Tahliye Emri Ver", description="Acil durum tahliye protokolünü başlatır ve güvenli bölgedeki personel sayısını raporlar.")
def trigger_evacuation(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    # SOCAR Tahliye Simülasyonu Endpoint'i: Sistemi Tahliye moduna zorlar
    users = db.query(models.User).all()
    total = len(users)
    evacuated = sum(1 for u in users if u.is_evacuated)
    
    # "is_evacuated" günümüzde yaka kartı Safe Zone access point'inden okunduğunda (MQTT aracılığıyla) otomatik True yapılır.
    return {
        "status": "EMERGENCY_EVACUATION_ACTIVE",
        "total_personnel": total,
        "evacuated": evacuated,
        "left_behind": total - evacuated,
        "message": f"Tüm fabrikaya tahliye emri verildi! Güvenli Alanda (Muster Point): {evacuated}/{total}. İÇERİDE KALAN RİSKLİ PERSONEL SAYISI: {total - evacuated}!"
    }

@router.patch("/{user_id}/location", response_model=schemas.UserResponse, summary="Personel Konumunu Güncelle", description="Bir personelin son konumu, sinyal gücü ve yetkilendirilmiş bölgeleri günceller.")
def update_personnel_location(user_id: int, payload: schemas.PersonnelLocationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id and not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Bu personelin konum bilgilerini güncelleme yetkiniz yok.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Personel bulunamadı")

    user.last_location = payload.location
    user.last_signal_dbm = payload.dbm
    user.last_seen = datetime.utcnow()
    if payload.authorized_zones is not None:
        user.authorized_zones = payload.authorized_zones

    if payload.location == "Safe Zone":
        user.is_evacuated = True
    else:
        user.is_evacuated = False

    if user.authorized_zones and user.authorized_zones != "All" and payload.location not in user.authorized_zones:
        sys_sensor = db.query(models.Sensor).first()
        if sys_sensor:
            existing = db.query(models.Alarm).filter(
                models.Alarm.sensor_id == sys_sensor.id,
                models.Alarm.status == "active",
                models.Alarm.message.contains(user.username)
            ).first()
            if not existing:
                new_alarm = models.Alarm(
                    sensor_id=sys_sensor.id,
                    severity="critical",
                    message=f"GEOFENCE İHLALİ! Yetkisiz Personel ({user.username}), '{payload.location}' bölgesinde bulundu!",
                    status="active",
                    timestamp=datetime.utcnow()
                )
                db.add(new_alarm)

    db.commit()
    db.refresh(user)
    return user
