from fastapi import APIRouter, HTTPException
import urllib.request
import json
import asyncio
from datetime import datetime
import influx

router = APIRouter(prefix="/api/environment", tags=["Çevresel İzleme"])

# Aliağa Koordinatları
LAT = 38.795
LON = 26.972

@router.get("/aliaga", summary="Aliağa Çevresel Verileri", description="İzmir Aliağa için anlık hava durumu, hava kalitesi ve 24 saatlik tahmin verilerini döndürür.")
def get_aliaga_env():
    # Varsayılan (Fallback) Veriler
    fallback = {
        "location": "Aliağa, İzmir",
        "current_weather": {
            "temperature": 24.5,
            "humidity": 55,
            "pressure": 1013,
            "unit_temp": "°C",
            "unit_humidity": "%",
            "unit_pressure": "hPa"
        },
        "forecast_hourly": {
            "times": [datetime.now().isoformat()],
            "temperatures": [24.5]
        },
        "air_quality": {
            "city": "Aliağa",
            "measurements": [],
            "last_updated": "N/A"
        }
    }

    try:
        # 1. Open-Meteo (Hava Durumu ve Tahmin)
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current=temperature_2m,relative_humidity_2m,surface_pressure&hourly=temperature_2m&timezone=auto&forecast_days=1"
        
        # 2. Open-Meteo Air Quality (Stable Alternative)
        aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={LAT}&longitude={LON}&current=european_aqi,pm10,pm2_5"

        try:
            with urllib.request.urlopen(weather_url, timeout=5) as response:
                weather_data = json.loads(response.read().decode())
                
            aq_data = {}
            try:
                with urllib.request.urlopen(aq_url, timeout=3) as response:
                    aq_raw = json.loads(response.read().decode())
                    if aq_raw.get("current"):
                        aq_data = aq_raw["current"]
            except Exception as e:
                print(f"Air Quality API error (Open-Meteo): {e}")

            return {
                "location": "Aliağa, İzmir",
                "current_weather": {
                    "temperature": weather_data["current"]["temperature_2m"],
                    "humidity": weather_data["current"]["relative_humidity_2m"],
                    "pressure": weather_data["current"]["surface_pressure"],
                    "unit_temp": "°C",
                    "unit_humidity": "%",
                    "unit_pressure": "hPa"
                },
                "forecast_hourly": {
                    "times": weather_data["hourly"]["time"][:24],
                    "temperatures": weather_data["hourly"]["temperature_2m"][:24]
                },
                "air_quality": {
                    "city": "Aliağa",
                    "measurements": [
                        {"parameter": "AQI", "value": aq_data.get("european_aqi", "--")},
                        {"parameter": "PM10", "value": aq_data.get("pm10", "--")},
                        {"parameter": "PM2.5", "value": aq_data.get("pm2_5", "--")}
                    ],
                    "last_updated": datetime.now().strftime("%H:%M:%S")
                }
            }
        except Exception as e:
            print(f"Weather API error: {e}")
            return fallback

    except Exception as e:
        print(f"Critical environment error: {e}")
        return fallback

async def start_environmental_sync():
    """Arka planda periyodik olarak Aliağa verilerini çeker ve InfluxDB'ye yazar."""
    print("[Environment] Çevresel veri senkronizasyonu başlatıldı.")
    while True:
        try:
            # 1. Open-Meteo Current
            url = f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current=temperature_2m,relative_humidity_2m,surface_pressure"
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode())["current"]
                
                influx.write_sensor_data("Aliaga-Temp", "weather", data["temperature_2m"])
                influx.write_sensor_data("Aliaga-Hum", "weather", data["relative_humidity_2m"])
                influx.write_sensor_data("Aliaga-Press", "weather", data["surface_pressure"])
            
            # 2. Open-Meteo Air Quality (Hava Kalitesi - Daha stabil alternatif)
            aq_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={LAT}&longitude={LON}&current=european_aqi,pm10,pm2_5"
            with urllib.request.urlopen(aq_url) as response:
                aq_data = json.loads(response.read().decode())["current"]
                
                # InfluxDB'ye yaz
                influx.write_sensor_data("Aliaga-AQI", "air_quality", aq_data["european_aqi"])
                influx.write_sensor_data("Aliaga-PM10", "air_quality", aq_data["pm10"])
                influx.write_sensor_data("Aliaga-PM25", "air_quality", aq_data["pm2_5"])

            print(f"[Environment] Veriler InfluxDB'ye yazıldı: {datetime.now()}")
        except Exception as e:
            print(f"[Environment Sync Error] {e}")
        
        # 10 dakikada bir güncelle
        await asyncio.sleep(600)
