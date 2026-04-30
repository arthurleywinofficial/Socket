import paho.mqtt.client as mqtt
import os
import json
import influx
from database import SessionLocal
import models
from websockets_manager import manager
import asyncio
from datetime import datetime

# Docker ağında Mosquitto container'ına erişim ararız:
MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto")
MQTT_PORT = 1883

def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] SOCAR Mosquitto Broker bağlantısı kilitlendi! Yanıt kodu: {rc}")
    # Tüm fabrika sensörlerini kapsayacak wildcard başlığı:
    client.subscribe("socar/sensors/+/data")
    # Yangın, gaz kaçağı ve ESD olayları için ek başlıklar
    client.subscribe("socar/safety/#")
    # Personel WiFi Yaka Kartları:
    client.subscribe("socar/personnel/+/location")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode('utf-8'))
        
        parts = topic.split("/")
        
        # ---------------- Personel Yaka Kartı Dinleyicisi ----------------
        if len(parts) >= 4 and parts[1] == "personnel":
            username = parts[2]
            loc = payload.get("location")
            dbm = payload.get("dbm", 0.0)
            
            db = SessionLocal()
            try:
                user = db.query(models.User).filter(models.User.username == username).first()
                if user:
                    user.last_location = loc
                    user.last_signal_dbm = dbm
                    user.last_seen = datetime.utcnow()
                    
                    if loc == "Safe Zone":
                        user.is_evacuated = True
                    else:
                        user.is_evacuated = False
                        
                    # Geofencing: İzin verilmeyen bölge ihlali
                    if user.authorized_zones and user.authorized_zones != "All" and loc not in user.authorized_zones:
                        sys_sensor = db.query(models.Sensor).first()
                        if sys_sensor:
                            existing = db.query(models.Alarm).filter(
                                models.Alarm.sensor_id == sys_sensor.id,
                                models.Alarm.status == "active",
                                models.Alarm.message.contains(username)
                            ).first()
                            
                            if not existing:
                                new_alarm = models.Alarm(
                                    sensor_id=sys_sensor.id,
                                    severity="critical",
                                    message=f"GEOFENCE İHLALİ! Yetkisiz Personel ({username}), güvencesiz olduğu '{loc}' bölgesine sızdı!",
                                    status="active",
                                    timestamp=datetime.utcnow()
                                )
                                db.add(new_alarm)
                                db.commit()
                                print(f"+++++ [GEOFENCE İHLALİ SİRENİ] {username} -> {loc} +++++")
                                
                                try:
                                    loop = asyncio.get_event_loop()
                                    if loop.is_running():
                                        loop.create_task(manager.broadcast_alarm("critical", f"{username} personeli yetkisiz giriş yaptı!", "Güvenlik Kamerası AI"))
                                    else:
                                        asyncio.run(manager.broadcast_alarm("critical", f"{username} personeli yetkisiz giriş yaptı!", "Güvenlik Kamerası AI"))
                                except Exception:
                                    pass
                                    
                    db.commit()
            finally:
                db.close()
                
        # ---------------- Endüstriyel Sensör Dinleyicisi ----------------
        elif len(parts) >= 4 and parts[1] == "sensors":
            sensor_name = parts[2]
            val = payload.get("value")
            stype = payload.get("type", "unknown")
            
            if val is not None:
                # 1. Ham akan veriyi InfluxDB'ye (Zaman Serisi) anında kalıcı olarak yaz
                influx.write_sensor_data(sensor_name, stype, val)
                print(f"[MQTT -> InfluxDB] Nakil Edildi: {sensor_name} -> {val} ({stype})")
                
                # 2. ISA-18.2 ALARM KONTROL NOKTASI
                db = SessionLocal()
                try:
                    sensor = db.query(models.Sensor).filter(models.Sensor.name == sensor_name).first()
                    if sensor and sensor.status == "active":
                        alarm_triggered = False
                        msg = ""
                        sev = "low"
                        sensor_type = sensor.sensor_type.lower() if sensor.sensor_type else ""
                        payload_type = str(stype).lower()
                        is_fire = "fire" in sensor_type or payload_type in ("fire", "smoke", "heat")
                        is_gas = any(g in sensor_type for g in ["h2s", "lpg", "voc", "gas"]) or payload_type in ("h2s", "lpg", "voc", "gas")
                        
                        if is_fire:
                            if payload.get("alarm") is True or (sensor.max_threshold is not None and val > sensor.max_threshold):
                                alarm_triggered = True
                                msg = f"YANGIN DEDEKTÖRÜ ALARMI! {sensor_name} algıladı. Değer: {val}"
                                sev = "critical"
                        elif is_gas:
                            if sensor.max_threshold is not None and val > sensor.max_threshold:
                                alarm_triggered = True
                                msg = f"GAZ KAÇAĞI ALARMI! {sensor.sensor_type.upper()} sensör değeri {val} > {sensor.max_threshold}"
                                sev = "critical"
                        else:
                            if sensor.max_threshold is not None and val > sensor.max_threshold:
                                alarm_triggered = True
                                msg = f"Sensör ({val}) maksimum güvenlik limitini ({sensor.max_threshold}) aştı!"
                                sev = "critical"
                            elif sensor.min_threshold is not None and val < sensor.min_threshold:
                                alarm_triggered = True
                                msg = f"Sensör ({val}) minimum limitin ({sensor.min_threshold}) altına düştü!"
                                sev = "high"
                            
                        # Debouncing: Eğer böyle bir alarm zaten aktifse veritabanını şişirme
                        if alarm_triggered:
                            existing_alarm = db.query(models.Alarm).filter(
                                models.Alarm.sensor_id == sensor.id, 
                                models.Alarm.status == "active"
                            ).first()
                            
                            if not existing_alarm:
                                new_alarm = models.Alarm(
                                    sensor_id=sensor.id,
                                    severity=sev,
                                    message=msg,
                                    status="active",
                                    timestamp=datetime.utcnow()
                                )
                                db.add(new_alarm)
                                db.commit()
                                print(f"+++++ [ENDÜSTRİYEL SİREN - ALARM TETİKLENDİ] {sensor_name} -> {msg} +++++")
                                
                                # Web socket üzerinden frontend'e anında siren çaldırmak için sinyal gönder:
                                try:
                                    loop = asyncio.get_event_loop()
                                    if loop.is_running():
                                        loop.create_task(manager.broadcast_alarm(sev, msg, sensor_name))
                                    else:
                                        asyncio.run(manager.broadcast_alarm(sev, msg, sensor_name))
                                except Exception as ews:
                                    print(f"[WS Error]: {ews}")
                finally:
                    db.close()
        elif len(parts) >= 3 and parts[1] == "safety":
            if parts[2] == "esd":
                action = payload.get("action")
                if action == "trigger":
                    reason = payload.get("reason", "MQTT kaynaklı acil kapatma")
                    db = SessionLocal()
                    try:
                        esd = models.EmergencyShutdown(
                            status="active",
                            reason=reason,
                            triggered_at=datetime.utcnow()
                        )
                        db.add(esd)
                        db.commit()
                        print(f"+++++ [ESD] Acil kapatma tetiklendi: {reason} +++++")
                        try:
                            loop = asyncio.get_event_loop()
                            if loop.is_running():
                                loop.create_task(manager.broadcast_alarm("critical", "Acil kapatma (ESD) devreye girdi!", "ESD System"))
                            else:
                                asyncio.run(manager.broadcast_alarm("critical", "Acil kapatma (ESD) devreye girdi!", "ESD System"))
                        except Exception as ews:
                            print(f"[WS Error]: {ews}")
                    finally:
                        db.close()
                
    except Exception as e:
        print(f"[MQTT Error] Veri işlenemedi: {e}")

client = mqtt.Client(client_id="socar_fastapi_listener")
client.on_connect = on_connect
client.on_message = on_message

def start_mqtt_client():
    try:
        # 60 saniye tut, koparsa arka planda kendi yeniden bağlansın.
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()  # Asenkron (API'yi bloklamadan) thread'da dinler.
        print("MQTT Loop Arka Planda Başlatıldı.")
    except Exception as e:
        print(f"[MQTT Error] Broker'a bağlantı kurulamadı: {e}")

def stop_mqtt_client():
    client.loop_stop()
    client.disconnect()
    print("MQTT Loop Kapatıldı.")
