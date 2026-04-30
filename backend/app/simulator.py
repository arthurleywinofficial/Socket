import paho.mqtt.client as mqtt
import time
import random
import json
import os

# Lokal bilgisayarınızdan çalıştıracağımız için "localhost" hedef seçilmiştir.
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = 1883

# SOCAR simülasyon sensörleri (Gerçek dünyayı simüle eden, rastgele dalgalanacak hedefler)
TARGET_SENSORS = [
    {"name": "Temp-Zone1", "type": "temperature", "base": 25.0},
    {"name": "Gas-H2S-Zone1", "type": "gas", "base": 0.0},
    {"name": "Humidity-Zone2", "type": "humidity", "base": 40.0},
    {"name": "Vibration-Motor1", "type": "vibration", "base": 1.5}
]

client = mqtt.Client(client_id="socar_industrial_simulator")

def run_simulation():
    print("=======================================")
    print(" SOCAR Endüstriyel Donanım Simülatörü  ")
    print("=======================================")
    
    while True:
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            break
        except Exception as e:
            print("Broker bekleniyor... Lütfen Docker'ın çalıştığından emin olun.")
            time.sleep(2)
            
    print("Simülatör MQTT'ye bağlandı. Gerçek zamanlı sensör verileri basılıyor...")
    print("Test izleme ekranı aktiftir. Her 2 saniyede bir paket gönderilecek.\n")
    
    PERSONNEL = ["admin", "operator", "technician"]
    ZONES = ["Zone 1", "Zone 2", "Zone 3", "Safe Zone"]
    
    while True:
        try:
            # Personel Yaka Kartı (Konum) Sinyali Gönder
            for p in PERSONNEL:
                # Bazen sinyal gecikmesi olsun (Lone Worker testi için)
                if random.random() > 0.8:
                    continue 
                    
                loc = random.choice(ZONES)
                dbm = round(random.uniform(-40, -90), 1)
                payload = {"location": loc, "dbm": dbm, "timestamp": int(time.time())}
                
                topic = f"socar/personnel/{p}/location"
                client.publish(topic, json.dumps(payload))
                print(f"[PUBLISH YAKA KARTI] {topic} -> {loc} ({dbm} dBm)")

            print("---")
            
            for s in TARGET_SENSORS:
                # Algoritma ile gerçekçi sensör dalgalanması (Jitter) yarat:
                if s["type"] == "temperature":
                    val = s["base"] + random.uniform(-2, 2)
                elif s["type"] == "gas":
                    # Gaz genelde 0.0'da seyreder.
                    val = s["base"] + random.uniform(0, 0.5)
                    # İleride alarmları test etmek için %5 ihtimalle ciddi bir gaz sızıntısı uyarısı yapalım!
                    if random.random() > 0.95: 
                        val += random.uniform(5.0, 15.0) 
                elif s["type"] == "vibration":
                    val = s["base"] + random.uniform(-0.2, 0.8)
                else:
                    val = s["base"] + random.uniform(-5, 5)
                    
                payload = {
                    "value": round(val, 2),
                    "type": s["type"],
                    "timestamp": int(time.time()),
                    "status": "active"
                }
                
                # Topic Endüstriyel Ağacı: socar/sensors/<ISIM>/data
                topic = f"socar/sensors/{s['name']}/data"
                client.publish(topic, json.dumps(payload))
                print(f"[PUBLISH] {topic} -> {payload['value']}")
            
            # 2 Saniyede 1 kez ağa sensör verisi pompala
            time.sleep(2)
        except Exception as e:
            print(f"[Simulator Error] {e}. Attempting to reconnect...")
            try:
                client.reconnect()
            except:
                pass
            time.sleep(5)

if __name__ == "__main__":
    try:
        run_simulation()
    except KeyboardInterrupt:
        print("\nSimülatör Durduruldu.")
