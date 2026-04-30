from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import os

INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "my-super-secret-auth-token")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "socar")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "sensors")

client = None
write_api = None

def get_influx_client():
    """InfluxDB client'ını döndürür, yoksa başlatır. Bağlantı kopmalarına karşı dirençlidir."""
    global client, write_api
    if client is None:
        try:
            client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG, timeout=10000)
            write_api = client.write_api(write_options=SYNCHRONOUS)
            print("[InfluxDB] Bağlantı başarılı.")
        except Exception as e:
            print(f"[InfluxDB Connection Error]: {e}")
            client = None
    return client

def init_influxdb():
    """Uygulama başlangıcında bağlantıyı zorlar."""
    get_influx_client()

def write_sensor_data(sensor_name: str, sensor_type: str, value: float, measurement: str = "environment"):
    try:
        # Client'ı hazırla
        get_influx_client()
        if not write_api:
            return
            
        point = Point(measurement) \
            .tag("sensor_name", sensor_name) \
            .tag("sensor_type", sensor_type) \
            .field("value", float(value))
        
        write_api.write(bucket=INFLUXDB_BUCKET, org=INFLUXDB_ORG, record=point)
    except Exception as e:
        print(f"[InfluxDB Write Error] {sensor_name}: {e}")

def query_latest_sensor_data(sensor_name: str) -> float:
    c = get_influx_client()
    if not c:
        return 0.0
    try:
        query_api = c.query_api()
        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range(start: -1h) |> filter(fn: (r) => r.sensor_name == "{sensor_name}") |> last()'
        tables = query_api.query(query, org=INFLUXDB_ORG)
        for table in tables:
            for record in table.records:
                return round(float(record.get_value()), 2)
    except Exception as e:
        print(f"[InfluxDB Query Error for {sensor_name}]: {e}")
    return 0.0

def query_sensor_history(sensor_name: str, range_hours: int = 1, start_time: str = None, stop_time: str = None):
    c = get_influx_client()
    if not c:
        return []
    try:
        query_api = c.query_api()
        range_val = f"start: {start_time}" if start_time else f"start: -{range_hours}h"
        if stop_time:
            range_val += f", stop: {stop_time}"
            
        query = f'from(bucket: "{INFLUXDB_BUCKET}") |> range({range_val}) |> filter(fn: (r) => r.sensor_name == "{sensor_name}") |> aggregateWindow(every: 1m, fn: mean, createEmpty: false) |> yield(name: "mean")'
        tables = query_api.query(query, org=INFLUXDB_ORG)
        history = []
        for table in tables:
            for record in table.records:
                history.append({
                    "time": record.get_time().isoformat(),
                    "value": round(float(record.get_value()), 2) if record.get_value() is not None else 0.0
                })
        return history
    except Exception as e:
        print(f"[InfluxDB History Error for {sensor_name}]: {e}")
    return []
