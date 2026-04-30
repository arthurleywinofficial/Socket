from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/alarms", tags=["Alarm ve Olaylar"])

# Alarmı herkes okuyabilir ama SADECE yetkili personel (Operator/Admin) müdahale edebilir ("Acknowledge")
def require_alarm_manager(current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.can_ack_alarms and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bu alarmı susturmak (Acknowledge) için Endüstriyel Operatör yetkiniz bulunmamaktır!")
    return current_user

@router.get("/", response_model=List[schemas.AlarmResponse], summary="Alarmları Listele", description="Sistemde oluşan tüm aktif veya geçmiş alarmları getirir. Duruma göre filtreleme yapılabilir.")
def get_alarms(status: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        query = db.query(models.Alarm)
        if status is not None:
            query = query.filter(models.Alarm.status == status)
        
        # Yeni alarmlar en tepede olsun
        return query.order_by(models.Alarm.timestamp.desc()).limit(100).all()
    except Exception as e:
        print(f"[Alarms Query Error]: {e}")
        return []

@router.patch("/{alarm_id}/acknowledge", response_model=schemas.AlarmResponse, summary="Alarmı Onayla/Kapat", description="Operatörün belirli bir alarmı gördüğünü teyit etmesini veya çözüldü olarak işaretlemesini sağlar.")
def acknowledge_alarm(alarm_id: int, ack_data: schemas.AlarmAcknowledge, db: Session = Depends(get_db), op: models.User = Depends(require_alarm_manager)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Sistemde böyle bir alarm kaydı bulunamadı")
        
    if ack_data.status not in ["acknowledged", "resolved"]:
        raise HTTPException(status_code=400, detail="Güvenlik Kuralı İhlali: Alarm durumu sadece 'acknowledged' veya 'resolved' yapılabilir.")
        
    alarm.status = ack_data.status
    alarm.acknowledged_by = op.id      # Sisteme logla (Kim müdahale etti?)
    alarm.acknowledged_at = datetime.utcnow() # Saat kaça bastı?
    db.commit()
    db.refresh(alarm)
    return alarm
