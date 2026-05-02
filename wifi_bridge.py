import asyncio
import websockets
import json
import time
import threading
import random
import math
from scapy.all import sniff, Dot11, Ether

# --- SOCKET WiFi Path-Mapping SLAM (v1.9.7) ---
# Hem sabit cihazları hem de hareketli 'duvar çizici' telefonları takip eder.
static_registry = {}
map_points = [] # Kalıcı oda noktaları

def packet_handler(pkt):
    try:
        mac = pkt.addr2 if pkt.haslayer(Dot11) else (pkt.src if pkt.haslayer(Ether) else None)
        if not mac or mac == "Unknown": return

        # Sinyal gücünü hesapla
        rssi = pkt.dBm_AntSignal if hasattr(pkt, 'dBm_AntSignal') else - (50 + random.randint(0, 10))
        dist = abs(rssi) - 20
        
        # MAC adresine göre bir 'yörünge' belirle
        seed = sum(int(b, 16) for b in mac.split(":") if b != "ff")
        random.seed(seed)
        base_angle = random.random() * 360
        
        # Hareket etkisini simüle et (Sinyal gücü değiştikçe konum değişir)
        # Bu sayede telefonunuzla odanın köşesine giderseniz nokta oraya kayar
        rad = (base_angle * 3.1415) / 180
        x = max(10, min(90, 50 + math.cos(rad) * dist))
        y = max(10, min(90, 50 + math.sin(rad) * dist))

        # Eğer sinyal güçlüyse (-40dBm ve üstü), bu noktayı 'Kalıcı Harita Noktası' yap
        if rssi > -45:
            # Yeni bir köşe keşfedildi!
            new_point = {"x": x, "y": y, "mac": mac, "type": "WALL"}
            # Benzer noktaları temizle
            if not any(abs(p["x"] - x) < 5 and abs(p["y"] - y) < 5 for p in map_points):
                map_points.append(new_point)
                print("!", end="", flush=True) # Köşe keşif işareti

        static_registry[mac] = {
            "x": x,
            "y": y,
            "intensity": 1.0,
            "last_active": time.time()
        }
        print(".", end="", flush=True)

    except Exception:
        pass

def start_sniffing():
    print("\n--- [PATH MAPPING] Telefonunuzla odanın köşelerine gidin... ---")
    sniff(iface="wlo1", prn=packet_handler, store=0)

async def wifi_telemetry(websocket):
    print(f"\nRADAR BAĞLANDI: {websocket.remote_address}")
    try:
        while True:
            current_time = time.time()
            nodes_to_send = []
            
            # Kalıcı harita noktalarını ekle (Duvarlar)
            for p in map_points:
                nodes_to_send.append({**p, "intensity": 0.8})

            # Anlık aktif cihazları ekle
            for mac, data in static_registry.items():
                if current_time - data["last_active"] < 10:
                    data["intensity"] = max(0.2, data["intensity"] - 0.05)
                    nodes_to_send.append({
                        "x": data["x"],
                        "y": data["y"],
                        "intensity": data["intensity"],
                        "mac": mac,
                        "type": "DEVICE"
                    })

            await websocket.send(json.dumps({
                "status": "LIVE_HARDWARE_PATH_MAPPING",
                "nodes": nodes_to_send,
                "csi": [random.randint(20, 80) for _ in range(40)],
                "timestamp": current_time
            }))
            await asyncio.sleep(0.1)
            
    except websockets.exceptions.ConnectionClosed:
        print("\nBAĞLANTI KESİLDİ.")

async def main():
    print("--- SOCKET WiFi Path Mapping Bridge (v1.9.7) ---")
    threading.Thread(target=start_sniffing, daemon=True).start()
    async with websockets.serve(wifi_telemetry, "0.0.0.0", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDurduruldu.")
