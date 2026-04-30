# 🥧 Socket IIoT Raspberry Pi Kurulum Rehberi

Bu proje Docker kullanılarak hazırlandığı için Raspberry Pi üzerine kurulumu oldukça basittir.

## 📋 Gereksinimler
- Raspberry Pi (3B+, 4 veya 5 önerilir)
- Raspberry Pi OS (64-bit önerilir)
- Docker & Docker Compose kurulu olmalıdır.

## 🛠️ Kurulum Adımları

### 1. Docker Kurulumu (Eğer kurulu değilse)
```bash
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Sistemi yeniden başlatın veya oturumu kapatıp açın.
```

### 2. Projeyi İndirme
```bash
git clone https://github.com/arthurleywinofficial/Socket.git
cd Socket
```

### 3. Sistemi Başlatma
```bash
docker-compose up -d --build
```

### 4. Frontend'i Yerel Olarak Çalıştırma (Opsiyonel)
Frontend'i doğrudan Pi üzerinden sunmak isterseniz bir Nginx konteyneri ekleyebiliriz veya basitçe:
```bash
cd frontend
npm install
npm run dev -- --host
```

## 🌐 Erişim
- **Panel:** `http://<raspberry-pi-ip>:3000`
- **API Status:** `http://<raspberry-pi-ip>:8000/status`
- **Grafana:** `http://<raspberry-pi-ip>:3001`

---
**Not:** Raspberry Pi üzerinde InfluxDB ve Postgres çalıştırırken kaliteli bir SD kart veya SSD kullanmanız önerilir.
