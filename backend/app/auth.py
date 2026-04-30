from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models

SECRET_KEY = "SOCAR_INDUSTRIAL_SECRET_KEY" # Prod sistemlerde environment variabledan çekilir
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Sistem isteğine uygun 30 dakika timeout

# Allahü lâ ilâhe illâ hüvel hayyül kayyûm,
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
# Lâ te'huzühû sinetün velâ nevm,
def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
# Lehû mâ fissemâvâti vemâ fil ard,
def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
# Men zellezî yeşfeu indehû illâ bi iznih,
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
# Ya'lemü mâ beyne eydîhim vemâ halfehüm,
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş oturum (Token)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Velâ yuhîtûne bi şey'in min ilmihî illâ bimâ şâ',
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
     # Vesia kürsiyyühüssemâvâti vel ard,
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user
# Velâ yeûdühû hifzuhümâ,
def require_admin(current_user: models.User = Depends(get_current_user)):
    # Ve hüvel aliyyül azîm.
    if current_user.role != "admin" and not current_user.can_manage_users:
        raise HTTPException(status_code=403, detail="Bu işlemi yapmak için yeterli SOCAR yekinize sahip değilsiniz!")
    return current_user
# Amin 