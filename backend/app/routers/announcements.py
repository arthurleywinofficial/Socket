from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/announcements", tags=["Duyurular"])

@router.get("/", response_model=List[schemas.AnnouncementResponse], summary="Duyuruları Listele", description="Sistemdeki tüm duyuruları en yeniden-en eskiye olacak şekilde listeler.")
def list_announcements(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Announcement).order_by(models.Announcement.timestamp.desc()).all()

@router.post("/", response_model=schemas.AnnouncementResponse, summary="Yeni Duyuru Yayınla", description="Sisteme yeni bir duyuru ekler. SADECE Admin yetkisi olanlar duyuru yapabilir.")
def create_announcement(announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    db_announcement = models.Announcement(
        title=announcement.title,
        content=announcement.content,
        author_id=admin.id
    )
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.delete("/{id}", summary="Duyuruyu Sil", description="Yayınlanmış bir duyuruyu sistemden kaldırır. SADECE Admin yetkisi olanlar silebilir.")
def delete_announcement(id: int, db: Session = Depends(get_db), admin: models.User = Depends(auth.require_admin)):
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Duyuru bulunamadı")
    
    db.delete(db_announcement)
    db.commit()
    return {"status": "success", "message": "Duyuru başarıyla silindi."}
