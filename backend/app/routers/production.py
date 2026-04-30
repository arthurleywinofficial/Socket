from fastapi import APIRouter, HTTPException
import urllib.request
import json
import asyncio
from datetime import datetime
import influx

router = APIRouter(prefix="/api/production", tags=["Üretim İzleme"])

# Sensör Tanımları ve Hedef Aralıklar
# (Min, Max, Birim)
METRICS = {
    "Pipeline-Pressure": {"min": 8.0, "max": 12.0, "unit": "bar"},
    "Pipeline-Temp": {"min": 15.0, "max": 25.0, "unit": "°C"},
    "Flow-Rate": {"min": 250.0, "max": 450.0, "unit": "m³/sa"},
    "Tank-Alpha-Level": {"min": 0.0, "max": 100.0, "unit": "%"},
    "Reactor-Beta-Temp": {"min": 450.0, "max": 650.0, "unit": "°C"}
}

@router.get("/status", summary="Anlık Üretim Verileri")
def get_production_status():
    """Üretim bandındaki kritik sensörlerin en son verilerini döner."""
    try:
        # InfluxDB'den son verileri çekip dönebiliriz (Opsiyonel)
        return {"status": "success", "metrics": METRICS}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def start_production_sync():
    """Arka planda Random.org API kullanarak verileri günceller ve InfluxDB'ye yazar."""
    print("[Production] Sensör senkronizasyonu başlatıldı.")
    
    while True:
        try:
            # 5 farklı sensör için 0-1000 arası rastgele tamsayı çekelim
            url = "https://www.random.org/integers/?num=5&min=0&max=1000&col=1&base=10&format=plain&rnd=new"
            
            random_values = []
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'SOCAR-Guardian/1.0'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    raw_data = response.read().decode().strip().split("\n")
                    if len(raw_data) >= 5:
                        random_values = [int(v) for v in raw_data]
            except Exception as e:
                print(f"[Production] Random.org error (using local fallback): {e}")
                import random
                random_values = [random.randint(0, 1000) for _ in range(5)]
            
            if len(random_values) < 5:
                continue
            
            # Verileri eşle ve InfluxDB'ye yaz
            metric_keys = list(METRICS.keys())
            for i in range(5):
                m_key = metric_keys[i]
                m_conf = METRICS[m_key]
                
                # 0-1000 değerini hedef aralığa lineer olarak map et
                range_size = m_conf["max"] - m_conf["min"]
                final_val = round(m_conf["min"] + (random_values[i] / 1000.0) * range_size, 2)
                
                # InfluxDB'ye 'production' ölçümü altında yaz
                influx.write_sensor_data(m_key, "industrial", final_val, measurement="production")
                
            print(f"[Production] 5 sensör verisi Random.org ile güncellendi: {datetime.now()}")
            
        except Exception as e:
            print(f"[Production Sync Error] {e}")
            # Kota aşımı veya bağlantı hatası durumunda 1 dakika bekle
            await asyncio.sleep(60)
        
        # 30 saniyede bir güncelle (Kotaları zorlamamak için)
        await asyncio.sleep(30)
