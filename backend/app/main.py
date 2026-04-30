from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
import asyncio
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from database import engine, SessionLocal
import models
from routers import users, sensors, alarms, personnel, announcements, environment, production, safety, home
from auth import get_password_hash
import mqtt
import influx
from websockets_manager import manager

# Uygulama açılırken şemaları DB'ye (PostgreSQL) yansıt
models.Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "Erişim Kontrolü", "description": "Giriş yapma ve yetkilendirme işlemleri"},
    {"name": "Kullanıcı Yönetimi", "description": "Sistem kullanıcılarını ekleme, silme ve yetkilendirme"},
    {"name": "Sensör Yönetimi", "description": "IoT sensörlerinin tanımlanması ve eşik değerlerinin kontrolü"},
    {"name": "Alarm ve Olaylar", "description": "Oluşan alarmların izlenmesi ve onaylanması"},
    {"name": "Personel ve Güvenlik", "description": "Tesis içindeki personel konumları ve tahliye yönetimi"},
    {"name": "Duyurular", "description": "Tesis genelindeki önemli duyuruların paylaşımı ve yönetimi"},
    {"name": "Güvenlik Sistemleri", "description": "ESD, yangın dedektörleri, gaz kaçakları ve acil durum yönetimi"},
    {"name": "Home Paneli", "description": "Enerji tüketimi, verimlilik ve karbon emisyonu özetlerini gösterir"},
    {"name": "Çevresel İzleme", "description": "Dış ortam hava durumu, tahmin ve hava kalitesi bilgileri"},
]

app = FastAPI(
    title="SOCKET | SOCAR Operasyon Kontrol ve Endüstriyel Takip",
    version="1.0.1",
    description="Grafana, InfluxDB ve PostgreSQL entegrasyonlu SOCKET veri servisi.",
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json",
    openapi_tags=tags_metadata
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        import sys
        print(f"--- GLOBAL EXCEPTION CAUGHT ---", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print(f"-------------------------------", file=sys.stderr)
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Sunucu tarafında beklenmedik bir hata oluştu. Lütfen sistem yöneticisine başvurun."}
        )

def seed_admin_user():
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        hashed_pw = get_password_hash("adminadmin")
        
        if not admin_user:
            new_admin = models.User(
                username="admin",
                hashed_password=hashed_pw,
                full_name="SOCAR Sistem Yöneticisi",
                role="admin",
                can_manage_sensors=True,
                can_ack_alarms=True,
                can_export=True,
                can_manage_users=True,
                can_manage_settings=True,
                can_trigger_evacuation=True,
                is_active=True,
                failed_login_attempts=0
            )
            db.add(new_admin)
            db.commit()
        else:
            # Şifreyi güncelle ve kilidi aç (is_active=True)
            admin_user.hashed_password = hashed_pw
            admin_user.is_active = True
            admin_user.failed_login_attempts = 0
            db.commit()
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    seed_admin_user()
    influx.init_influxdb()
    mqtt.start_mqtt_client()
    # Çevresel, üretim, enerji ve bakım veri senkronizasyonunu arka planda başlat
    asyncio.create_task(environment.start_environmental_sync())
    asyncio.create_task(production.start_production_sync())
    asyncio.create_task(home.start_home_energy_sync())
    asyncio.create_task(home.start_home_maintenance_sync())
    asyncio.create_task(home.start_home_quality_sync())
    asyncio.create_task(home.start_home_logistics_sync())
    asyncio.create_task(home.start_home_financial_sync())

@app.on_event("shutdown")
def shutdown_event():
    mqtt.stop_mqtt_client()

@app.websocket("/ws/alarms")
async def websocket_endpoint(websocket: WebSocket):
    # ISA-18.2 Canlı Siren Paneli (Frontend Dashboard'ı açıldığı an buraya bağlanacak)
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Router'ları ana uygulamaya bağla
app.include_router(users.auth_router)
app.include_router(users.router)
app.include_router(sensors.router)
app.include_router(alarms.router)
app.include_router(personnel.router)
app.include_router(safety.router)
app.include_router(home.router)
app.include_router(announcements.router)
app.include_router(environment.router)
app.include_router(production.router)

@app.get("/")
def read_root():
    # Artık 8000'e giren kullanıcıyı yeni dokümantasyon merkezine (8001) fırlatıyoruz!
    return RedirectResponse(url="http://localhost:8001")

@app.get("/status")
def get_status():
    return {
        "status": "online",
        "message": "SOCKET IIoT Core Aktif!",
        "mqtt_simulator": mqtt.client.is_connected()
    }
