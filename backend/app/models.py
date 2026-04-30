from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from datetime import datetime
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    shift = Column(String, default="Gündüz") 
    
    role = Column(String, default="viewer") 
    is_active = Column(Boolean, default=True)
    failed_login_attempts = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    
    # Adım 6: Personel Takip (WiFi, Lone Worker & Geofence) Bilgileri
    last_location = Column(String, default="Unknown")
    last_signal_dbm = Column(Float, nullable=True) # WiFi Çekim gücü
    last_seen = Column(DateTime, nullable=True) # Son sinyal saati
    is_evacuated = Column(Boolean, default=False)
    authorized_zones = Column(String, default="All") # Örn: "Zone 1, Zone 2" ya da "All"
    
    # Detaylı RBAC (İzin tabanlı) Kontroller 
    can_manage_sensors = Column(Boolean, default=False)
    can_ack_alarms = Column(Boolean, default=False)
    can_export = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    can_manage_settings = Column(Boolean, default=False)
    can_trigger_evacuation = Column(Boolean, default=False)

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    sensor_type = Column(String, nullable=False) # gas, temp, vb.
    category = Column(String, default="generic")
    location = Column(String, nullable=False) 
    status = Column(String, default="active")
    min_threshold = Column(Float, nullable=True) 
    max_threshold = Column(Float, nullable=True) 

class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    severity = Column(String, default="medium") # critical, high, medium, low
    message = Column(String, nullable=False)
    status = Column(String, default="active") # active, acknowledged, resolved
    timestamp = Column(DateTime, nullable=False)
    
    # Müdahale eden operatör
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    # İlişkisel (ORM) Bağlantıları
    sensor = relationship("Sensor")
    ack_user = relationship("User")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author = relationship("User")

class EmergencyShutdown(Base):
    __tablename__ = "emergency_shutdowns"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="inactive")
    reason = Column(String, nullable=True)
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    triggered_at = Column(DateTime, nullable=True)
    reset_at = Column(DateTime, nullable=True)

    triggered_user = relationship("User")
