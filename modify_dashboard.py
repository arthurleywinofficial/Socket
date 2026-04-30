import json
import os

DASHBOARD_PATH = "/home/arthur/Proje/grafana/provisioning/dashboards/home.json"

with open(DASHBOARD_PATH, "r") as f:
    data = json.load(f)

max_y = 0
for panel in data.get("panels", []):
    if "gridPos" in panel:
        y = panel["gridPos"].get("y", 0) + panel["gridPos"].get("h", 0)
        if y > max_y:
            max_y = y

current_y = max_y + 1

new_panels = [
    {
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": current_y },
      "id": 9901,
      "title": "🔴 Gerçek Zamanlı Endüstriyel Sensörler (MQTT Simülatörü)",
      "type": "row"
    },
    {
      "datasource": { "type": "influxdb", "uid": "InfluxDB" },
      "fieldConfig": {
        "defaults": { "color": { "mode": "thresholds" }, "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": None }, { "color": "orange", "value": 30 }, { "color": "red", "value": 40 }] }, "unit": "celsius" }
      },
      "gridPos": { "h": 5, "w": 6, "x": 0, "y": current_y + 1 },
      "id": 9902,
      "options": { "colorMode": "value", "graphMode": "area", "justifyMode": "center", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "targets": [{ "query": 'from(bucket: "sensors") |> range(start: -1h) |> filter(fn: (r) => r.sensor_name == "Temp-Zone1") |> last() |> set(key: "_field", value: "")', "refId": "A" }],
      "title": "Bölge 1 - Sıcaklık (+/- Dalgalı)",
      "type": "stat"
    },
    {
      "datasource": { "type": "influxdb", "uid": "InfluxDB" },
      "fieldConfig": {
        "defaults": { "color": { "mode": "thresholds" }, "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": None }, { "color": "yellow", "value": 0.5 }, { "color": "red", "value": 5 }] }, "unit": "ppm" }
      },
      "gridPos": { "h": 5, "w": 6, "x": 6, "y": current_y + 1 },
      "id": 9903,
      "options": { "colorMode": "value", "graphMode": "area", "justifyMode": "center", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "targets": [{ "query": 'from(bucket: "sensors") |> range(start: -1h) |> filter(fn: (r) => r.sensor_name == "Gas-H2S-Zone1") |> last() |> set(key: "_field", value: "")', "refId": "A" }],
      "title": "Bölge 1 - H2S Gaz Seviyesi (Sızıntı Alarm Test)",
      "type": "stat"
    },
    {
      "datasource": { "type": "influxdb", "uid": "InfluxDB" },
      "fieldConfig": {
        "defaults": { "color": { "mode": "thresholds" }, "thresholds": { "mode": "absolute", "steps": [{ "color": "cyan", "value": None }, { "color": "blue", "value": 60 }] }, "unit": "percent" }
      },
      "gridPos": { "h": 5, "w": 6, "x": 12, "y": current_y + 1 },
      "id": 9904,
      "options": { "colorMode": "value", "graphMode": "area", "justifyMode": "center", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "targets": [{ "query": 'from(bucket: "sensors") |> range(start: -1h) |> filter(fn: (r) => r.sensor_name == "Humidity-Zone2") |> last() |> set(key: "_field", value: "")', "refId": "A" }],
      "title": "Bölge 2 - Ortam Nemi",
      "type": "stat"
    },
    {
      "datasource": { "type": "influxdb", "uid": "InfluxDB" },
      "fieldConfig": {
        "defaults": { "color": { "mode": "thresholds" }, "thresholds": { "mode": "absolute", "steps": [{ "color": "green", "value": None }, { "color": "orange", "value": 2.0 }, { "color": "red", "value": 4.0 }] }, "unit": "mm/s" }
      },
      "gridPos": { "h": 5, "w": 6, "x": 18, "y": current_y + 1 },
      "id": 9905,
      "options": { "colorMode": "value", "graphMode": "area", "justifyMode": "center", "reduceOptions": { "calcs": ["lastNotNull"] } },
      "targets": [{ "query": 'from(bucket: "sensors") |> range(start: -1h) |> filter(fn: (r) => r.sensor_name == "Vibration-Motor1") |> last() |> set(key: "_field", value: "")', "refId": "A" }],
      "title": "Motor 1 - Titreşim",
      "type": "stat"
    },
    {
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": current_y + 6 },
      "id": 9906,
      "title": "👥 Personel Konum Takibi (RFID & WiFi Yaka Kartları)",
      "type": "row"
    },
    {
      "datasource": { "type": "postgres", "uid": "PostgreSQL" },
      "gridPos": { "h": 10, "w": 24, "x": 0, "y": current_y + 7 },
      "id": 9907,
      "targets": [
        { "format": "table", "rawSql": "SELECT username as \"Personel\", last_location as \"Son Konum\", last_signal_dbm || ' dBm' as \"Sinyal Gücü\", CASE WHEN is_evacuated THEN 'Güvende ✅' ELSE 'Sahada ⚠️' END as \"Güvenlik Durumu\", TO_CHAR(last_seen, 'DD.MM.YYYY HH24:MI:SS') as \"Son Görülme\" FROM users WHERE username != 'admin' ORDER BY last_seen DESC NULLS LAST", "refId": "A" }
      ],
      "title": "Personel Geçiş Logları",
      "type": "table"
    }
]

data["panels"].extend(new_panels)

with open(DASHBOARD_PATH, "w") as f:
    json.dump(data, f, indent=2)

print("SUCCESS")
