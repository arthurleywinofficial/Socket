from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio
import models, schemas, auth
from database import get_db
from websockets_manager import manager

router = APIRouter(prefix="/api/safety", tags=["Güvenlik Sistemleri"])

# ESD ve acil durum yetkisi: admin ya da özel yetki sahibi

def require_esd_manager(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin" and not current_user.can_manage_settings and not current_user.can_trigger_evacuation:
        raise HTTPException(status_code=403, detail="Acil durum / ESD tetikleme yetkiniz yok.")
    return current_user

@router.get("/esd/status", response_model=schemas.EmergencyShutdownResponse, summary="ESD Durumu", description="Acil kapatma sisteminin son durumunu getirir.")
def get_esd_status(db: Session = Depends(get_db)):
    latest = db.query(models.EmergencyShutdown).order_by(models.EmergencyShutdown.triggered_at.desc()).first()
    if not latest:
        return {
            "id": 0,
            "status": "inactive",
            "reason": "Henüz ESD tetiklenmedi.",
            "triggered_by": None,
            "triggered_at": None,
            "reset_at": None
        }
    return latest

@router.post("/esd/trigger", response_model=schemas.EmergencyShutdownResponse, summary="ESD Tetikle", description="Acil kapatma sistemini devreye sokar.")
def trigger_esd(payload: schemas.EmergencyShutdownCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_esd_manager)):
    latest = db.query(models.EmergencyShutdown).order_by(models.EmergencyShutdown.triggered_at.desc()).first()
    if latest and latest.status == "active":
        raise HTTPException(status_code=409, detail="ESD zaten aktif durumda.")

    esd = models.EmergencyShutdown(
        status="active",
        reason=payload.reason,
        triggered_by=current_user.id,
        triggered_at=datetime.utcnow()
    )
    db.add(esd)
    db.commit()
    db.refresh(esd)

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast_alarm("critical", "Acil kapatma (ESD) devreye girdi!", "ESD System"))
        else:
            asyncio.run(manager.broadcast_alarm("critical", "Acil kapatma (ESD) devreye girdi!", "ESD System"))
    except Exception:
        pass

    return esd

@router.post("/esd/reset", response_model=schemas.EmergencyShutdownResponse, summary="ESD Resetle", description="Acil kapatma sistemini sıfırlar ve normale döndürür.")
def reset_esd(db: Session = Depends(get_db), current_user: models.User = Depends(require_esd_manager)):
    latest = db.query(models.EmergencyShutdown).order_by(models.EmergencyShutdown.triggered_at.desc()).first()
    if not latest or latest.status != "active":
        raise HTTPException(status_code=404, detail="Aktif bir ESD kaydı bulunamadı.")

    latest.status = "inactive"
    latest.reset_at = datetime.utcnow()
    db.commit()
    db.refresh(latest)
    return latest

@router.post("/simulate-crisis", summary="Suni Kriz Oluştur", description="Test amaçlı suni bir kriz (gaz sızıntısı, yangın vb.) tetikler.")
async def simulate_crisis(crisis_type: str, db: Session = Depends(get_db), current_user: models.User = Depends(require_esd_manager)):
    if crisis_type == "gas_leak":
        await manager.broadcast_alarm("critical", "Bölge 1: Kritik H2S Gaz Sızıntısı Tespit Edildi!", "Gas Detector 01")
        return {"status": "success", "message": "Gaz sızıntısı krizi tetiklendi."}
    elif crisis_type == "fire":
        await manager.broadcast_alarm("critical", "Bölge 4: Yangın Alarmı Aktif!", "Fire System")
        return {"status": "success", "message": "Yangın krizi tetiklendi."}
    elif crisis_type == "temp_critical":
        await manager.broadcast_alarm("warning", "Reaktör B: Yüksek Sıcaklık Uyarısı!", "Thermal Sensor")
        return {"status": "success", "message": "Sıcaklık krizi tetiklendi."}
    else:
        raise HTTPException(status_code=400, detail="Geçersiz kriz tipi.")
