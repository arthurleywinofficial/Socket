from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    shift: Optional[str] = "Gündüz"
    role: str
    
    can_manage_sensors: bool = False
    can_ack_alarms: bool = False
    can_export: bool = False
    can_manage_users: bool = False
    can_manage_settings: bool = False
    can_trigger_evacuation: bool = False

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    shift: str
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    
    last_location: Optional[str] = "Unknown"
    last_signal_dbm: Optional[float] = None
    last_seen: Optional[datetime] = None
    is_evacuated: Optional[bool] = False
    authorized_zones: Optional[str] = "All"
    
    class Config:
        from_attributes = True

class PersonnelTrackingReport(BaseModel):
    user: UserResponse
    status: str # "safe", "lone_worker_danger" Veya "geofence_breach"

class SensorBase(BaseModel):
    name: str
    sensor_type: str
    location: str
    category: Optional[str] = "generic"
    status: Optional[str] = "active"
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None

class SensorCreate(SensorBase):
    pass

class SensorUpdate(BaseModel):
    status: Optional[str] = None
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None

class SensorResponse(SensorBase):
    id: int
    
    class Config:
        from_attributes = True

class AlarmBase(BaseModel):
    sensor_id: int
    severity: str
    message: str
    status: str

class AlarmResponse(AlarmBase):
    id: int
    timestamp: datetime
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AlarmAcknowledge(BaseModel):
    status: str

class EmergencyShutdownBase(BaseModel):
    reason: Optional[str] = "Acil ESD tetikleme"

class EmergencyShutdownCreate(EmergencyShutdownBase):
    pass

class EmergencyShutdownResponse(EmergencyShutdownBase):
    id: int
    status: str
    triggered_by: Optional[int] = None
    triggered_at: Optional[datetime] = None
    reset_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PersonnelLocationUpdate(BaseModel):
    location: str
    dbm: Optional[float] = None
    authorized_zones: Optional[str] = None

class EnergyMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str

class EnergySummaryResponse(BaseModel):
    electricity_kwh: float
    steam_tons: float
    water_m3: float
    efficiency_pct: float
    efficiency_status: str
    efficiency_recommendation: str
    carbon_kg: float
    carbon_intensity: float
    metrics: Optional[list[EnergyMetric]]

class MaintenanceMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str

class MaintenanceSummaryResponse(BaseModel):
    pump_vibration: float
    compressor_vibration: float
    turbine_vibration: float
    filter_condition: float
    valve_position: float
    predictive_health: str
    recommendation: str
    metrics: Optional[list[MaintenanceMetric]]

class ProductQualityMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str

class ProductQualitySummaryResponse(BaseModel):
    product_purity: float
    daily_target_pct: float
    monthly_target_pct: float
    lab_result_score: float
    quality_status: str
    recommendation: str
    metrics: Optional[list[ProductQualityMetric]]

class LogisticsMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str

class LogisticsSummaryResponse(BaseModel):
    raw_material_tank_pct: float
    product_tank_pct: float
    tanker_loading_pct: float
    ship_loading_pct: float
    warehouse_utilization_pct: float
    inventory_turnover_pct: float
    critical_skus: int
    current_ship: str
    ship_status: str
    inventory_status: str
    recommendation: str
    metrics: Optional[list[LogisticsMetric]]

class HomeMenuItem(BaseModel):
    id: str
    title: str
    description: str
    endpoint: str

class HomeMenuResponse(BaseModel):
    menu: list[HomeMenuItem]

class AnnouncementBase(BaseModel):
    title: str
    content: str

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    timestamp: datetime
    author_id: int
    
    class Config:
        from_attributes = True

class FinancialMetric(BaseModel):
    name: str
    value: float
    unit: str
    status: str

class FinancialSummaryResponse(BaseModel):
    daily_revenue: float
    daily_gross_profit: float
    daily_operating_cost: float
    net_profit_margin_pct: float
    roi_pct: float
    financial_status: str
    recommendation: str
    metrics: Optional[list[FinancialMetric]]

class ZoneData(BaseModel):
    id: str
    name: str
    x_pct: float
    y_pct: float
    personnel: list[str]
    emergencies: list[str]
    profit_loss: float
    is_bypassed: bool
    is_downtime: bool
