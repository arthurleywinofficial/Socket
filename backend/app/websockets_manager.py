from fastapi import WebSocket
from typing import List
import json

class ConnectionManager:
    def __init__(self):
        # Canlı izleyici paneline bağlanan web soket istemcilerini (örn React Dashboardu) tutar.
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Yeni Yönetim Paneli Bağlandı. Aktif Bağlantı: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] İstasyon Ayrıldı. Kalan: {len(self.active_connections)}")

    async def broadcast_alarm(self, severity: str, message: str, sensor_name: str):
        # Tüm fabrikaya anlık kırmızı alarm uyarısı geçer!
        data = {
            "type": "NEW_ALARM",
            "severity": severity,
            "sensor": sensor_name,
            "message": message
        }
        
        # Olası bağlantı koptu hatalarını yutarak diğer client'lara atmaya devam eder
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                dead_connections.append(connection)
                
        # Ölü bağlantıları listeden izole et
        for dead in dead_connections:
            self.disconnect(dead)

# Bellekte yaşayacak tek bir yönetici nesnesi Singleton gibi yaratılır
manager = ConnectionManager()
