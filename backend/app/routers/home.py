from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import urllib.request
import random
import asyncio
from datetime import datetime
import schemas
import influx
import models
from database import get_db
from routers import environment, production

router = APIRouter(prefix="/api/home", tags=["Home Paneli"])

RANDOM_ORG_URL = "https://www.random.org/integers/?num=5&min=0&max=1000&col=1&base=10&format=plain&rnd=new"


def fetch_random_values():
    # random.org'a yapılan senkron HTTP istekleri tüm event loop'u bloke ettiği için 
    # (ve timeout'a düştüğünde sunucuyu kilitlediği için) tamamen lokal randomizasyona geçildi.
    return [random.randint(0, 1000) for _ in range(5)]


async def start_home_energy_sync():
    print("[Home] Enerji verisi senkronizasyonu başlatıldı.")
    while True:
        try:
            values = fetch_random_values()
            energy_data = {
                "Electricity": round(12000 + (values[0] / 1000.0) * 2500, 2),
                "Steam": round(60 + (values[1] / 1000.0) * 40, 2),
                "Water": round(3200 + (values[2] / 1000.0) * 900, 2),
                "Carbon": round(1300 + (values[4] / 1000.0) * 400, 2)
            }

            for name, value in energy_data.items():
                influx.write_sensor_data(name, "energy", value, measurement="energy")

            print(f"[Home] Enerji verisi InfluxDB'ye yazıldı: {datetime.utcnow()}")
        except Exception as e:
            print(f"[Home Energy Sync Error] {e}")
        await asyncio.sleep(60)


async def start_home_quality_sync():
    print("[Home] Ürün kalite verisi senkronizasyonu başlatıldı.")
    while True:
        try:
            values = fetch_random_values()
            quality_data = {
                "Product-Purity": round(92 + (values[0] / 1000.0) * 8, 2),
                "Daily-Target": round(70 + (values[1] / 1000.0) * 30, 2),
                "Monthly-Target": round(65 + (values[2] / 1000.0) * 35, 2),
                "Lab-Result": round(75 + (values[3] / 1000.0) * 25, 2)
            }

            for name, value in quality_data.items():
                influx.write_sensor_data(name, "quality", value, measurement="quality")

            print(f"[Home] Ürün kalite verisi InfluxDB'ye yazıldı: {datetime.utcnow()}")
        except Exception as e:
            print(f"[Home Quality Sync Error] {e}")
        await asyncio.sleep(60)


async def start_home_logistics_sync():
    print("[Home] Lojistik ve stok verisi senkronizasyonu başlatıldı.")
    while True:
        try:
            values = fetch_random_values()
            logistics_data = {
                "Raw-Tank-Level": round(55 + (values[0] / 1000.0) * 35, 1),
                "Product-Tank-Level": round(45 + (values[1] / 1000.0) * 50, 1),
                "Tanker-Loading": round(25 + (values[2] / 1000.0) * 70, 1),
                "Ship-Loading": round(20 + (values[3] / 1000.0) * 75, 1),
                "Warehouse-Utilization": round(50 + (values[4] / 1000.0) * 45, 1)
            }
            for name, value in logistics_data.items():
                influx.write_sensor_data(name, "logistics", value, measurement="logistics")

            print(f"[Home] Lojistik verisi InfluxDB'ye yazıldı: {datetime.utcnow()}")
        except Exception as e:
            print(f"[Home Logistics Sync Error] {e}")
        await asyncio.sleep(60)


@router.get("/", response_model=schemas.HomeMenuResponse, summary="Home Menüsü", description="Home panelinde gösterilecek menü öğelerini döner.")
def get_home_menu():
    return {
        "menu": [
            {
                "id": "energy-management",
                "title": "Enerji Yönetimi",
                "description": "Elektrik, buhar, su tüketimi, verimlilik analizi ve karbon emisyon takibini gösterir.",
                "endpoint": "/api/home/energy"
            },
            {
                "id": "product-quality",
                "title": "Ürün Kalitesi",
                "description": "Ürün saflık oranları, hedef takibi ve laboratuvar sonuçları özetini gösterir.",
                "endpoint": "/api/home/quality"
            },
            {
                "id": "logistics-overview",
                "title": "Lojistik & Stok Yönetimi",
                "description": "Ham madde ve ürün tank seviyeleri, tanker/gemi yükleme takibi ve stok yönetimini gösterir.",
                "endpoint": "/api/home/logistics"
            },
            {
                "id": "maintenance-overview",
                "title": "Bakım & Titreşim",
                "description": "Pompa, kompresör, türbin titreşimleri ve filtre/vanaların durumunu gösterir.",
                "endpoint": "/api/home/maintenance"
            },
            {
                "id": "safety-overview",
                "title": "Güvenlik & Acil Durum",
                "description": "ESD, yangın, gaz kaçakları ve personel güvenliği özetini gösterir.",
                "endpoint": "/api/safety/esd/status"
            },
            {
                "id": "production-status",
                "title": "Üretim İzleme",
                "description": "Boru basıncı, sıcaklık, akış hızı ve reaktör verilerini gösterir.",
                "endpoint": "/api/production/status"
            },
            {
                "id": "environment-summary",
                "title": "Çevresel İzleme",
                "description": "Hava durumu, AQI ve saha çevresel koşullarını gösterir.",
                "endpoint": "/api/environment/aliaga"
            },
            {
                "id": "personnel-tracking",
                "title": "Personel Takibi",
                "description": "Tesis içindeki personelin konum ve tahliye durumunu gösterir.",
                "endpoint": "/api/personnel/tracking"
            }
        ]
    }


@router.get("/overview", summary="Home Genel Bakış", description="Home panelinde gösterilecek ana dashboard verilerini toplar.")
def get_home_overview(db: Session = Depends(get_db)):
    # Her bölümü try-except ile koruyalım ki tek bir modül hatası tüm dashboardu bozmasın
    try:
        energy = get_home_energy_summary()
    except Exception as e:
        print(f"Energy summary error: {e}")
        energy = {"electricity_kwh": 0, "steam_tons": 0, "water_m3": 0, "carbon_kg": 0, "efficiency_pct": 0, "metrics": []}

    try:
        maintenance = get_home_maintenance_summary()
    except Exception as e:
        print(f"Maintenance summary error: {e}")
        maintenance = {"health_score": 0, "metrics": []}

    try:
        quality = get_home_quality_summary()
    except Exception as e:
        print(f"Quality summary error: {e}")
        quality = {"quality_status": "Bilinmiyor", "metrics": []}

    try:
        logistics = get_home_logistics_summary()
    except Exception as e:
        print(f"Logistics summary error: {e}")
        logistics = {"inventory_status": "Bilinmiyor", "metrics": []}

    try:
        production_result = production.get_production_status()
    except Exception:
        production_result = {"status": "error", "metrics": {}}

    try:
        env = environment.get_aliaga_env()
    except Exception:
        env = {"current_weather": {}, "air_quality": {}}

    active_alarms = 0
    latest_esd = None
    personnel_list = []
    try:
        active_alarms = db.query(models.Alarm).filter(models.Alarm.status == "active").count()
        latest_esd = db.query(models.EmergencyShutdown).order_by(models.EmergencyShutdown.triggered_at.desc()).first()
        personnel_query = db.query(models.User).filter(models.User.role != 'admin')
        personnel_list = personnel_query.all()
    except Exception as e:
        print(f"Database query error in overview: {e}")

    evacuated = sum(1 for u in personnel_list if u.is_evacuated)
    total_personnel = len(personnel_list)
    safe = total_personnel - evacuated
    
    logs = []
    try:
        for u in personnel_list[:5]:
            logs.append({
                "username": u.username,
                "location": u.last_location or "-",
                "signal": u.last_signal_dbm or 0,
                "safe": u.is_evacuated,
                "last_seen": u.last_seen.strftime("%H:%M:%S") if u.last_seen else "-"
            })
    except Exception:
        pass

    simulator = {
        "temp_zone1": influx.query_latest_sensor_data("Temp-Zone1"),
        "gas_h2s_zone1": influx.query_latest_sensor_data("Gas-H2S-Zone1"),
        "humidity_zone2": influx.query_latest_sensor_data("Humidity-Zone2"),
        "vibration_motor1": influx.query_latest_sensor_data("Vibration-Motor1")
    }

    try:
        financial = get_home_financial_summary()
    except Exception as e:
        print(f"Financial summary error: {e}")
        financial = {"daily_revenue": 0, "daily_gross_profit": 0, "metrics": []}

    return {
        "status": "online",
        "energy": energy,
        "maintenance": maintenance,
        "quality": quality,
        "logistics": logistics,
        "production": production_result,
        "environment": env,
        "simulator": simulator,
        "personnel_logs": logs,
        "financial": financial,
        "safety": {
            "active_alarms": active_alarms,
            "esd_status": latest_esd.status if latest_esd else "inactive",
            "esd_reason": latest_esd.reason if latest_esd else "Henüz ESD tetiklenmedi.",
            "esd_triggered_at": latest_esd.triggered_at.isoformat() if latest_esd and latest_esd.triggered_at else None
        },
        "personnel": {
            "total": total_personnel,
            "evacuated": evacuated,
            "safe": safe
        },
        "generated_at": datetime.utcnow().isoformat()
    }


@router.get("/maintenance", response_model=schemas.MaintenanceSummaryResponse, summary="Bakım ve Titreşim Özeti", description="Pompa, kompresör ve türbin titreşimleri ile filtre ve vana durum özetini döner.")
def get_home_maintenance_summary():
    values = fetch_random_values()
    pump_vibration = round(0.6 + (values[0] / 1000.0) * 4.4, 2)
    compressor_vibration = round(0.5 + (values[1] / 1000.0) * 4.5, 2)
    turbine_vibration = round(0.7 + (values[2] / 1000.0) * 5.3, 2)
    filter_condition = round(60 + (values[3] / 1000.0) * 40, 1)
    valve_position = round(10 + (values[4] / 1000.0) * 80, 1)

    health_score = 100 - ((pump_vibration + compressor_vibration + turbine_vibration) / 12.0 * 20)
    if filter_condition < 70 or valve_position < 25:
        health_score -= 15
    if health_score >= 80:
        predictive_health = "İyi"
        recommendation = "Bakım durumu stabil. Planlı izleme ile devam edin."
    elif health_score >= 60:
        predictive_health = "Orta"
        recommendation = "Yakın zamanda detaylı kontrol ve filtre/vanaların incelenmesi önerilir."
    else:
        predictive_health = "Uyarı"
        recommendation = "Hemen bakım planlanmalı. Pompa, kompresör veya türbin titreşimleri kritik seviyeye yaklaşmış."

    metrics = [
        {"name": "Pompa Titreşimi", "value": pump_vibration, "unit": "mm/s", "status": "high" if pump_vibration > 4.0 else "normal"},
        {"name": "Kompresör Titreşimi", "value": compressor_vibration, "unit": "mm/s", "status": "high" if compressor_vibration > 4.0 else "normal"},
        {"name": "Türbin Titreşimi", "value": turbine_vibration, "unit": "mm/s", "status": "high" if turbine_vibration > 5.0 else "normal"},
        {"name": "Filtre Durumu", "value": filter_condition, "unit": "%", "status": "warning" if filter_condition < 75 else "normal"},
        {"name": "Vana Pozisyonu", "value": valve_position, "unit": "%", "status": "warning" if valve_position < 30 else "normal"}
    ]

    return {
        "pump_vibration": pump_vibration,
        "compressor_vibration": compressor_vibration,
        "turbine_vibration": turbine_vibration,
        "filter_condition": filter_condition,
        "valve_position": valve_position,
        "predictive_health": predictive_health,
        "recommendation": recommendation,
        "metrics": metrics
    }


@router.get("/quality", response_model=schemas.ProductQualitySummaryResponse, summary="Ürün Kalitesi Özeti", description="Ürün saflık oranları, günlük/aylık hedef gerçekleşme ve laboratuvar sonuçlarını gösterir.")
def get_home_quality_summary():
    values = fetch_random_values()
    product_purity = round(92 + (values[0] / 1000.0) * 8, 2)
    daily_target_pct = round(70 + (values[1] / 1000.0) * 30, 2)
    monthly_target_pct = round(65 + (values[2] / 1000.0) * 35, 2)
    lab_result_score = round(75 + (values[3] / 1000.0) * 25, 2)

    quality_status = "İyi"
    recommendation = "Ürün kalitesi ve hedef gerçekleşmesi tatmin edici."
    if product_purity < 94 or lab_result_score < 80 or daily_target_pct < 80 or monthly_target_pct < 75:
        quality_status = "İkaz"
        recommendation = "Hedef gerçekleşme ve kalite izleme gereken alanları içermektedir. Laboratuvar sonuçlarını yakından takip edin."
    if product_purity < 92 or lab_result_score < 75:
        quality_status = "Düşük"
        recommendation = "Ürün saflık oranı ve laboratuvar sonuçları kritik. Acil kalite iyileştirme aksiyonu alın."

    metrics = [
        {"name": "Ürün Saflığı", "value": product_purity, "unit": "%", "status": "high" if product_purity >= 96 else "warning" if product_purity >= 94 else "critical"},
        {"name": "Günlük Hedef", "value": daily_target_pct, "unit": "%", "status": "normal" if daily_target_pct >= 90 else "warning"},
        {"name": "Aylık Hedef", "value": monthly_target_pct, "unit": "%", "status": "normal" if monthly_target_pct >= 85 else "warning"},
        {"name": "Laboratuvar Sonucu", "value": lab_result_score, "unit": "%", "status": "normal" if lab_result_score >= 85 else "warning"}
    ]

    return {
        "product_purity": product_purity,
        "daily_target_pct": daily_target_pct,
        "monthly_target_pct": monthly_target_pct,
        "lab_result_score": lab_result_score,
        "quality_status": quality_status,
        "recommendation": recommendation,
        "metrics": metrics
    }


@router.get("/logistics", response_model=schemas.LogisticsSummaryResponse, summary="Lojistik ve Stok Yönetimi Özeti", description="Ham madde ve ürün tank seviyeleri, tanker/gemi yükleme takibi ve stok yönetimini rastgele verilerle gösterir.")
def get_home_logistics_summary():
    values = fetch_random_values()
    raw_material_tank_pct = round(55 + (values[0] / 1000.0) * 35, 1)
    product_tank_pct = round(45 + (values[1] / 1000.0) * 50, 1)
    tanker_loading_pct = round(25 + (values[2] / 1000.0) * 70, 1)
    ship_loading_pct = round(20 + (values[3] / 1000.0) * 75, 1)
    warehouse_utilization_pct = round(50 + (values[4] / 1000.0) * 45, 1)
    critical_skus = max(1, int(12 - (values[0] / 1000.0) * 10))
    inventory_turnover_pct = round(55 + (values[1] / 1000.0) * 35, 1)
    current_ship = random.choice(["MT Titan", "VLCC Aurora", "SS Karadeniz", "M/V Istanbul"])

    if tanker_loading_pct > 85 and ship_loading_pct > 80:
        ship_status = "Yükleme Tamamlandı"
    elif tanker_loading_pct > 60 or ship_loading_pct > 60:
        ship_status = "Yükleme Devam Ediyor"
    else:
        ship_status = "Yükleme Başladı"

    inventory_score = 100
    inventory_score -= max(0, warehouse_utilization_pct - 85) * 0.7
    inventory_score -= max(0, 85 - inventory_turnover_pct) * 0.5
    inventory_score -= critical_skus * 2.0
    inventory_score = max(0, inventory_score)

    if inventory_score >= 75:
        inventory_status = "İyi"
        recommendation = "Stok seviyesi ve yükleme operasyonları sağlıklı. Planlı takip ile devam edin."
    elif inventory_score >= 55:
        inventory_status = "Orta"
        recommendation = "Depo doluluk ve tanker/gemi yükleme süreçleri izlenmeli. Kritik SKU’lar için öncelikli kontrol önerilir."
    else:
        inventory_status = "Uyarı"
        recommendation = "Acil stok optimizasyonu ve dağıtım planlaması gereklidir. Tank seviyeleri ve doluluk riski yüksek."

    metrics = [
        {"name": "Ham Madde Tankı", "value": raw_material_tank_pct, "unit": "%", "status": "normal" if raw_material_tank_pct >= 60 else "warning"},
        {"name": "Ürün Tankı", "value": product_tank_pct, "unit": "%", "status": "normal" if product_tank_pct >= 55 else "warning"},
        {"name": "Tanker Yükleme", "value": tanker_loading_pct, "unit": "%", "status": "normal" if tanker_loading_pct <= 90 else "high"},
        {"name": "Gemi Yükleme", "value": ship_loading_pct, "unit": "%", "status": "normal" if ship_loading_pct <= 90 else "high"},
        {"name": "Depo Doluluk", "value": warehouse_utilization_pct, "unit": "%", "status": "warning" if warehouse_utilization_pct >= 85 else "normal"},
        {"name": "Stok Devir Hızı", "value": inventory_turnover_pct, "unit": "%", "status": "normal" if inventory_turnover_pct >= 75 else "warning"}
    ]

    return {
        "raw_material_tank_pct": raw_material_tank_pct,
        "product_tank_pct": product_tank_pct,
        "tanker_loading_pct": tanker_loading_pct,
        "ship_loading_pct": ship_loading_pct,
        "warehouse_utilization_pct": warehouse_utilization_pct,
        "inventory_turnover_pct": inventory_turnover_pct,
        "critical_skus": critical_skus,
        "current_ship": current_ship,
        "ship_status": ship_status,
        "inventory_status": inventory_status,
        "recommendation": recommendation,
        "metrics": metrics
    }


@router.get("/energy", response_model=schemas.EnergySummaryResponse, summary="Enerji Yönetimi Özeti", description="Elektrik, buhar, su tüketimi, enerji verimliliği ve karbon emisyon takibini örnek rastgele verilerle gösterir.")
def get_home_energy_summary():
    values = fetch_random_values()

    electricity_kwh = round(12000 + (values[0] / 1000.0) * 2500, 2)
    steam_tons = round(60 + (values[1] / 1000.0) * 40, 2)
    water_m3 = round(3200 + (values[2] / 1000.0) * 900, 2)
    efficiency_pct = round(65 + (values[3] / 1000.0) * 30, 2)
    carbon_kg = round(1300 + (values[4] / 1000.0) * 400, 2)

    score = efficiency_pct
    if score >= 90:
        efficiency_status = "Çok iyi"
        recommendation = "Enerji verimliliğiniz yüksek. Mevcut süreçleri koruyun ve optimize etmeye devam edin."
    elif score >= 75:
        efficiency_status = "İyi"
        recommendation = "Verimlilik iyi, fakat buzu eritmek için küçük tasarruf önlemleri uygulayın."
    elif score >= 60:
        efficiency_status = "Orta"
        recommendation = "Enerji yönetimi iyileştirilmesi gerekiyor. Fazla tüketen alanları acilen inceleyin."
    else:
        efficiency_status = "Zayıf"
        recommendation = "Acil müdahale şart. Elektrik, buhar ve su kullanımını azaltacak hızlı aksiyonlar alın."

    carbon_intensity = round(carbon_kg / max(1.0, (electricity_kwh / 1000.0) + steam_tons), 4)

    metrics = [
        {
            "name": "Elektrik Tüketimi",
            "value": electricity_kwh,
            "unit": "kWh",
            "status": "normal" if electricity_kwh < 13500 else "high"
        },
        {
            "name": "Buhar Tüketimi",
            "value": steam_tons,
            "unit": "ton",
            "status": "normal" if steam_tons < 90 else "high"
        },
        {
            "name": "Su Tüketimi",
            "value": water_m3,
            "unit": "m³",
            "status": "normal" if water_m3 < 3700 else "high"
        },
        {
            "name": "Karbon Emisyonu",
            "value": carbon_kg,
            "unit": "kg CO2",
            "status": "normal" if carbon_kg < 1550 else "high"
        }
    ]

    return {
        "electricity_kwh": electricity_kwh,
        "steam_tons": steam_tons,
        "water_m3": water_m3,
        "efficiency_pct": efficiency_pct,
        "efficiency_status": efficiency_status,
        "efficiency_recommendation": recommendation,
        "carbon_kg": carbon_kg,
        "carbon_intensity": carbon_intensity,
        "metrics": metrics
    }


async def start_home_maintenance_sync():
    print("[Home] Bakım verisi senkronizasyonu başlatıldı.")
    while True:
        try:
            values = fetch_random_values()
            maintenance_data = {
                "Pump-Vibration": round(0.6 + (values[0] / 1000.0) * 4.4, 2),
                "Compressor-Vibration": round(0.5 + (values[1] / 1000.0) * 4.5, 2),
                "Turbine-Vibration": round(0.7 + (values[2] / 1000.0) * 5.3, 2),
                "Filter-Condition": round(60 + (values[3] / 1000.0) * 40, 1),
                "Valve-Position": round(10 + (values[4] / 1000.0) * 80, 1)
            }

            for name, value in maintenance_data.items():
                influx.write_sensor_data(name, "maintenance", value, measurement="maintenance")

            print(f"[Home] Bakım verisi InfluxDB'ye yazıldı: {datetime.utcnow()}")
        except Exception as e:
            print(f"[Home Maintenance Sync Error] {e}")
        await asyncio.sleep(60)


@router.get("/history", summary="Geçmiş Veriler")
def get_home_history(sensor: str, hours: int = 1, start: str = None, end: str = None):
    return influx.query_sensor_history(sensor, hours, start_time=start, stop_time=end)


@router.get("/metrics/list", summary="Metrik Listesi", description="Karşılaştırma için kullanılabilecek tüm metriklerin listesini döner.")
def get_metrics_list():
    return [
        # Üretim & Endüstriyel
        {"id": "Temp-Zone1", "name": "Bölge 1 Sıcaklık", "unit": "°C", "color": "#00d4ff", "category": "Üretim"},
        {"id": "Gas-H2S-Zone1", "name": "H2S Gazı (Bölge 1)", "unit": "ppm", "color": "#ff3c50", "category": "Üretim"},
        {"id": "Humidity-Zone2", "name": "Bölge 2 Nem", "unit": "%", "color": "#00ff9d", "category": "Üretim"},
        {"id": "Vibration-Motor1", "name": "Motor 1 Titreşim", "unit": "mm/s", "color": "#fbbf24", "category": "Üretim"},
        {"id": "Pipeline-Pressure", "name": "Hat Basıncı", "unit": "bar", "color": "#a855f7", "category": "Üretim"},
        {"id": "Pipeline-Temp", "name": "Hat Sıcaklığı", "unit": "°C", "color": "#fb7185", "category": "Üretim"},
        {"id": "Flow-Rate", "name": "Akış Hızı", "unit": "m³/sa", "color": "#38bdf8", "category": "Üretim"},
        {"id": "Tank-Alpha-Level", "name": "Tank Alpha Seviye", "unit": "%", "color": "#2dd4bf", "category": "Üretim"},
        {"id": "Reactor-Beta-Temp", "name": "Reaktör Beta Temp", "unit": "°C", "color": "#f43f5e", "category": "Üretim"},

        # Enerji & Faydalı Model
        {"id": "Electricity", "name": "Elektrik Tüketimi", "unit": "kWh", "color": "#fbbf24", "category": "Enerji"},
        {"id": "Steam", "name": "Buhar Tüketimi", "unit": "ton", "color": "#94a3b8", "category": "Enerji"},
        {"id": "Water", "name": "Su Tüketimi", "unit": "m³", "color": "#38bdf8", "category": "Enerji"},
        {"id": "Carbon", "name": "Karbon Emisyonu", "unit": "kg", "color": "#4ade80", "category": "Enerji"},

        # Bakım & Titreşim (Home Modülü)
        {"id": "Pump-Vibration", "name": "Pompa Titreşimi", "unit": "mm/s", "color": "#f43f5e", "category": "Bakım"},
        {"id": "Compressor-Vibration", "name": "Kompresör Titreşimi", "unit": "mm/s", "color": "#ec4899", "category": "Bakım"},
        {"id": "Turbine-Vibration", "name": "Türbin Titreşimi", "unit": "mm/s", "color": "#d946ef", "category": "Bakım"},
        {"id": "Filter-Condition", "name": "Filtre Durumu", "unit": "%", "color": "#8b5cf6", "category": "Bakım"},
        {"id": "Valve-Position", "name": "Vana Pozisyonu", "unit": "%", "color": "#6366f1", "category": "Bakım"},

        # Kalite & Lojistik
        {"id": "Product-Purity", "name": "Ürün Saflığı", "unit": "%", "color": "#0ea5e9", "category": "Kalite"},
        {"id": "Daily-Target", "name": "Günlük Hedef", "unit": "%", "color": "#06b6d4", "category": "Kalite"},
        {"id": "Monthly-Target", "name": "Aylık Hedef", "unit": "%", "color": "#0891b2", "category": "Kalite"},
        {"id": "Lab-Result", "name": "Laboratuvar Skoru", "unit": "pt", "color": "#22d3ee", "category": "Kalite"},

        {"id": "Raw-Tank-Level", "name": "Ham Madde Stok", "unit": "%", "color": "#f59e0b", "category": "Lojistik"},
        {"id": "Product-Tank-Level", "name": "Mamul Ürün Stok", "unit": "%", "color": "#10b981", "category": "Lojistik"},
        {"id": "Tanker-Loading", "name": "Tanker Dolum Hızı", "unit": "%", "color": "#fb923c", "category": "Lojistik"},
        {"id": "Ship-Loading", "name": "Gemi Yükleme Hızı", "unit": "%", "color": "#f472b6", "category": "Lojistik"},
        {"id": "Warehouse-Utilization", "name": "Depo Doluluk", "unit": "%", "color": "#94a3b8", "category": "Lojistik"},

        # Çevresel
        {"id": "Aliaga-Temp", "name": "Dış Hava Sıcaklığı", "unit": "°C", "color": "#f87171", "category": "Çevre"},
        {"id": "Aliaga-Hum", "name": "Dış Hava Nemi", "unit": "%", "color": "#60a5fa", "category": "Çevre"},
        {"id": "Aliaga-Press", "name": "Dış Hava Basıncı", "unit": "bar", "color": "#3b82f6", "category": "Çevre"},
        {"id": "Aliaga-AQI", "name": "Hava Kalitesi (AQI)", "unit": "", "color": "#fbbf24", "category": "Çevre"},
        {"id": "Aliaga-PM10", "name": "Partikül (PM10)", "unit": "µg/m³", "color": "#a78bfa", "category": "Çevre"},
        {"id": "Aliaga-PM25", "name": "Partikül (PM2.5)", "unit": "µg/m³", "color": "#f472b6", "category": "Çevre"},

        # Finansal
        {"id": "Revenue", "name": "Günlük Gelir", "unit": "$", "color": "#10b981", "category": "Finans"},
        {"id": "Gross-Profit", "name": "Brüt Kar", "unit": "$", "color": "#34d399", "category": "Finans"},
        {"id": "Operating-Cost", "name": "Operasyonel Maliyet", "unit": "$", "color": "#f43f5e", "category": "Finans"},
        {"id": "ROI", "name": "ROI", "unit": "%", "color": "#3b82f6", "category": "Finans"}
    ]
@router.get("/financial", response_model=schemas.FinancialSummaryResponse, summary="Finansal Özet", description="Gelir, brüt kar ve maliyet özetini döner.")
def get_home_financial_summary():
    values = fetch_random_values()
    revenue = round(250000 + (values[0] / 1000.0) * 150000, 2)
    operating_cost = round(120000 + (values[1] / 1000.0) * 50000, 2)
    gross_profit = round(revenue - operating_cost, 2)
    profit_margin = round((gross_profit / revenue) * 100, 2)
    roi = round(15 + (values[2] / 1000.0) * 12, 2)

    if profit_margin >= 45:
        status = "Yüksek Karlılık"
        recommendation = "Mali performans mükemmel. Kapasite artırımı değerlendirilebilir."
    elif profit_margin >= 30:
        status = "Stabil"
        recommendation = "Karlılık beklenen seviyede. Maliyet optimizasyonuna devam edin."
    else:
        status = "Düşük Marj"
        recommendation = "Operasyonel maliyetler yüksek. Verimlilik artırıcı önlemler alınmalı."

    metrics = [
        {"name": "Günlük Gelir", "value": revenue, "unit": "$", "status": "high" if revenue > 350000 else "normal"},
        {"name": "Brüt Kar", "value": gross_profit, "unit": "$", "status": "high" if gross_profit > 180000 else "normal"},
        {"name": "Operasyonel Maliyet", "value": operating_cost, "unit": "$", "status": "warning" if operating_cost > 160000 else "normal"},
        {"name": "ROI", "value": roi, "unit": "%", "status": "normal" if roi > 20 else "warning"}
    ]

    return {
        "daily_revenue": revenue,
        "daily_gross_profit": gross_profit,
        "daily_operating_cost": operating_cost,
        "net_profit_margin_pct": profit_margin,
        "roi_pct": roi,
        "financial_status": status,
        "recommendation": recommendation,
        "metrics": metrics
    }

async def start_home_financial_sync():
    print("[Home] Finansal veri senkronizasyonu başlatıldı.")
    while True:
        try:
            values = fetch_random_values()
            revenue = round(250000 + (values[0] / 1000.0) * 150000, 2)
            operating_cost = round(120000 + (values[1] / 1000.0) * 50000, 2)
            gross_profit = round(revenue - operating_cost, 2)
            roi = round(15 + (values[2] / 1000.0) * 12, 2)

            data = {
                "Revenue": revenue,
                "Gross-Profit": gross_profit,
                "Operating-Cost": operating_cost,
                "ROI": roi
            }

            for name, value in data.items():
                influx.write_sensor_data(name, "financial", value, measurement="financial")

            print(f"[Home] Finansal veri InfluxDB'ye yazıldı: {datetime.utcnow()}")
        except Exception as e:
            print(f"[Home Financial Sync Error] {e}")
        await asyncio.sleep(60)

@router.get("/map/zones", response_model=list[schemas.ZoneData], summary="Saha Haritası Bölgeleri", description="İnteraktif harita için bölge verilerini döner.")
def get_map_zones():
    values = [random.randint(0, 1000) for _ in range(7)]
    
    def random_bool(threshold):
        return random.random() < threshold
        
    zones = [
        {
            "id": "zone-1",
            "name": "Kuzey İşletme (Parsel 1)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Ahmet Yılmaz", "Veli Demir"],
            "emergencies": ["Basınç valfi arızası", "Sensör kalibrasyon hatası"],
            "profit_loss": round(15000 + (values[0]/1000.0)*5000, 2),
            "is_bypassed": False,
            "is_downtime": random_bool(0.1)
        },
        {
            "id": "zone-2",
            "name": "Kuzeydoğu Depolama (Parsel 2)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Ayşe Çelik", "Mehmet Kaya"],
            "emergencies": ["Tank B seviyesi düşük", "Soğutma sistemi uyarısı"],
            "profit_loss": round(45000 + (values[1]/1000.0)*15000, 2),
            "is_bypassed": random_bool(0.2),
            "is_downtime": False
        },
        {
            "id": "zone-3",
            "name": "Merkez Arıtma (Parsel 3)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Mustafa Can", "Elif Bozkurt"],
            "emergencies": ["Filtre basıncı yüksek", "Pompa akım dalgalanması"],
            "profit_loss": round(-5000 + (values[2]/1000.0)*3000, 2),
            "is_bypassed": False,
            "is_downtime": random_bool(0.15)
        },
        {
            "id": "zone-4",
            "name": "Merkez Doğu Reaktör (Parsel 4)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Ali Yıldız", "Zeynep Arslan"],
            "emergencies": ["Reaktör sıcaklık limiti uyarısı", "Boru hattı titreşimi"],
            "profit_loss": round(8000 + (values[3]/1000.0)*4000, 2),
            "is_bypassed": random_bool(0.1),
            "is_downtime": False
        },
        {
            "id": "zone-5",
            "name": "Güney Üretim Alanı (Parsel 5)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Caner Kılıç", "Hasan Şahin"],
            "emergencies": ["Jeneratör voltaj uyarısı", "Akü seviyesi kritik"],
            "profit_loss": round(-12000 + (values[4]/1000.0)*2000, 2),
            "is_bypassed": True,
            "is_downtime": random_bool(0.2)
        },
        {
            "id": "zone-6",
            "name": "Güneydoğu Lojistik (Parsel 6)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Buse Doğan", "Kaan Yıldırım"],
            "emergencies": ["Yükleme rampası arızası", "Forklift sensör hatası"],
            "profit_loss": round(25000 + (values[0]/1000.0)*5000, 2),
            "is_bypassed": False,
            "is_downtime": random_bool(0.1)
        },
        {
            "id": "zone-7",
            "name": "Doğu Kontrol Merkezi (Parsel 7)",
            "x_pct": 0, "y_pct": 0,
            "personnel": ["Oğuzhan Çetin", "Cemre Akyol"],
            "emergencies": ["Sunucu odası sıcaklık uyarısı", "Haberleşme gecikmesi"],
            "profit_loss": round(18000 + (values[6]/1000.0)*3000, 2),
            "is_bypassed": random_bool(0.05),
            "is_downtime": False
        }
    ]
    return zones
