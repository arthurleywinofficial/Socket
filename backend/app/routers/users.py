from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import schemas, models, auth
from database import get_db

router = APIRouter(prefix="/api/users", tags=["Kullanıcı Yönetimi"])
auth_router = APIRouter(prefix="/api/auth", tags=["Erişim Kontrolü"])

@auth_router.post("/login", response_model=schemas.Token, summary="Sisteme Giriş Yap", description="Kullanıcı adı ve şifre ile sisteme giriş yaparak JWT token alır.")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı.")
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Sisteme erişiminiz kilitlenmiş durumda. Admin ile görüşün.")
        
    if not auth.verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 3:
            user.is_active = False # 3 hatada hesabı pasifize et
            db.commit()
            raise HTTPException(status_code=403, detail="Üst üste 3 hatalı şifre girişi! Endüstriyel güvenlik sebebiyle hesabınız KİLİTLENDİ.")
        
        db.commit()
        raise HTTPException(status_code=401, detail=f"Hatalı şifre. Kalan hakkınız: {3 - user.failed_login_attempts}")
        
    # Her şey normalse başarılı logini kaydet ve hataları sıfırla
    user.failed_login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/", response_model=schemas.UserResponse, summary="Yeni Kullanıcı Oluştur", description="Sisteme yeni bir personel veya operatör ekler (Sadece Admin yetkisiyle).")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten mevcut!")
        
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_pw,
        full_name=user.full_name,
        shift=user.shift,
        role=user.role,
        can_manage_sensors=user.can_manage_sensors,
        can_ack_alarms=user.can_ack_alarms,
        can_export=user.can_export,
        can_manage_users=user.can_manage_users,
        can_manage_settings=user.can_manage_settings,
        can_trigger_evacuation=user.can_trigger_evacuation
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=list[schemas.UserResponse], summary="Kullanıcıları Listele", description="Sistemdeki tüm kayıtlı kullanıcıları ve yetkilerini getirir.")
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    return db.query(models.User).offset(skip).limit(limit).all()

@router.delete("/{user_id}", summary="Kullanıcıyı Sil", description="Belirtilen kullanıcıyı sistemden kalıcı olarak siler.")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Güvenlik İhlali: Kendi admin hesabınızı silemezsiniz!")
        
    db.delete(user_to_delete)
    db.commit()
    return {"status": "success", "message": f"{user_to_delete.username} sistemden uzaklaştırıldı."}
