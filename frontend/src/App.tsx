import React, { useEffect, useMemo, useState } from 'react'
import { Activity, BarChart2, Bell, ChartLine, ChartNoAxesCombined, CircleDollarSign, Cloud, LayoutGrid, Moon, Settings2, ShieldAlert, SunMedium, Users, SlidersHorizontal, Map, HelpCircle, Shield, Lock, Thermometer, Droplets, RefreshCw, Clock, AlertTriangle, LifeBuoy, Menu, User, Trash2, Edit3 } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend } from 'chart.js'
import Sidebar from './components/Sidebar'
import AIAssistant from './components/AIAssistant'
import CrisisSimulator from './components/CrisisSimulator'
import InteractiveMapPage from './pages/InteractiveMapPage'
import GraphAnalysisPage from './pages/GraphAnalysisPage'
import LoginPage from './pages/LoginPage'
import MetricCard from './components/MetricCard'
import TimeSeriesPanel from './components/TimeSeriesPanel'
import LiveMetricSelector from './components/LiveMetricSelector'
import LoadingSkeleton from './components/LoadingSkeleton'
import UserMenu from './components/UserMenu'
import useLocalStorage from './hooks/useLocalStorage'
import { API_BASE } from './config'

// Error Page Component
const ErrorPage = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="error-page fade-in">
    <div className="error-card">
      <div className="error-icon-wrapper">
        <AlertTriangle size={48} className="error-icon" />
      </div>
      <h1>Sistem Kritik Hatası</h1>
      <p className="error-desc">Operasyonel panelde beklenmedik bir teknik aksaklık oluştu.</p>
      
      <div className="error-details">
        <code>{error.message}</code>
      </div>

      <div className="error-actions">
        <button className="primary-btn" onClick={resetErrorBoundary}>
          Sistemi Yeniden Başlat
        </button>
      </div>

      <div className="support-info">
        <div className="support-item">
          <LifeBuoy size={16} />
          <span>Teknik Destek: <strong>0212 555 00 00</strong></span>
        </div>
        <div className="support-item">
          <Shield size={16} />
          <span>BT Güvenlik: <strong>it-support@socar.com.tr</strong></span>
        </div>
      </div>
    </div>

    <style>{`
      .error-page {
        height: 100vh; width: 100vw; background: #0b0d11;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif; color: #fff;
      }
      .error-card {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 24px; padding: 3rem; width: 480px; text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      }
      .error-icon-wrapper {
        width: 80px; height: 80px; background: rgba(239, 68, 68, 0.1);
        border-radius: 20px; display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.5rem;
      }
      .error-icon { color: #ef4444; }
      .error-card h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      .error-desc { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin-bottom: 2rem; }
      .error-details {
        background: #000; padding: 1rem; border-radius: 12px; margin-bottom: 2rem;
        font-family: monospace; font-size: 0.8rem; color: #ef4444; text-align: left;
        border-left: 3px solid #ef4444;
      }
      .primary-btn {
        width: 100%; padding: 0.8rem; border-radius: 12px; background: var(--accent, #00d4ff);
        color: #000; border: none; font-weight: 700; cursor: pointer; transition: 0.2s;
        margin-bottom: 2rem;
      }
      .primary-btn:hover { transform: scale(1.02); }
      .support-info { display: flex; flex-direction: column; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; }
      .support-item { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.6); }
      .support-item strong { color: #fff; }
    `}</style>
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Critical Failure:", error, errorInfo); }
  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorPage error={this.state.error} resetErrorBoundary={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend)


interface Metric {
  id: string
  name: string
  unit: string
  color: string
}

interface Overview {
  status: string
  energy: any
  maintenance: any
  quality: any
  logistics: any
  production: any
  environment: any
  simulator: any
  personnel_logs: any[]
  financial: any
  safety: any
  personnel: any
  generated_at: string
}

const MENU = [
  {
    title: 'ANA İZLEME',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
      { id: 'live', label: 'Canlı Veriler', icon: Activity },
      { id: 'charts', label: 'Grafikler & Trendler', icon: ChartLine },
      { id: 'analysis', label: 'Grafikler & Analiz', icon: ChartNoAxesCombined }
    ]
  },
  {
    title: 'OPERASYON',
    items: [
      { id: 'map', label: 'Saha Haritası', icon: Map },
      { id: 'production', label: 'Üretim İzleme', icon: SlidersHorizontal },
      { id: 'environment', label: 'Çevresel İzleme', icon: Cloud },
      { id: 'personnel', label: 'Personel Takibi', icon: Users }
    ]
  },
  {
    title: 'GÜVENLİK',
    items: [
      { id: 'status', label: 'Bağlantı Durumu', icon: Settings2 }
    ]
  },
  {
    title: 'BİLGİ',
    items: [
      { id: 'help', label: 'Yardım Merkezi', icon: HelpCircle },
      { id: 'privacy', label: 'Gizlilik Politikası', icon: Shield }
    ]
  }
]

const ranges = [
  { value: 60, label: '1dk' },
  { value: 300, label: '5dk' },
  { value: 900, label: '15dk' },
  { value: 3600, label: '1sa' }
]

const fallbackData = () => {
  const randomValue = (min: number, max: number) => Math.round(min + Math.random() * (max - min) * 10) / 10
  return {
    energy: {
      electricity_kwh: randomValue(11800, 13200),
      steam_tons: randomValue(62, 88),
      water_m3: randomValue(3200, 3650),
      efficiency_pct: randomValue(68, 88),
      carbon_kg: randomValue(1320, 1480)
    },
    maintenance: {
      pump_vibration: randomValue(1.2, 4.1),
      compressor_vibration: randomValue(1.0, 4.3),
      turbine_vibration: randomValue(1.5, 5.0),
      filter_condition: randomValue(70, 92),
      valve_position: randomValue(35, 88),
      predictive_health: 'İyi',
      recommendation: 'Sistem performansı normal.'
    },
    quality: {
      product_purity: randomValue(93, 98),
      daily_target_pct: randomValue(76, 94),
      monthly_target_pct: randomValue(70, 88),
      lab_result_score: randomValue(80, 92),
      quality_status: 'İyi',
      recommendation: 'Kalite yönetimi stabil.'
    },
    logistics: {
      raw_material_tank_pct: randomValue(60, 90),
      product_tank_pct: randomValue(52, 88),
      tanker_loading_pct: randomValue(30, 72),
      ship_loading_pct: randomValue(28, 78),
      warehouse_utilization_pct: randomValue(58, 88),
      inventory_turnover_pct: randomValue(62, 85),
      critical_skus: Math.floor(randomValue(2, 10)),
      current_ship: 'MT Titan',
      ship_status: 'Yükleme Devam Ediyor',
      inventory_status: 'İyi',
      recommendation: 'Stok seviyesi kontrol altında.'
    },
    production: {
      status: 'success',
      metrics: {
        'Pipeline-Pressure': { value: randomValue(8.5, 11.5), min: 8.0, max: 12.0, unit: 'bar' },
        'Pipeline-Temp': { value: randomValue(16.0, 24.0), min: 15.0, max: 25.0, unit: '°C' },
        'Flow-Rate': { value: randomValue(280.0, 420.0), min: 250.0, max: 450.0, unit: 'm³/sa' },
        'Tank-Alpha-Level': { value: randomValue(40.0, 85.0), min: 0.0, max: 100.0, unit: '%' },
        'Reactor-Beta-Temp': { value: randomValue(510.0, 620.0), min: 450.0, max: 650.0, unit: '°C' }
      }
    },
    environment: {
      temperature: randomValue(24, 37),
      humidity: randomValue(38, 70),
      pressure: randomValue(1000, 1030),
      signal: randomValue(-84, -54),
      location: 'Aliağa, İzmir',
      air_quality: {
        measurements: [{ parameter: 'pm2_5', value: randomValue(12, 40) }],
        last_updated: 'Şimdi'
      }
    },
    safety: {
      active_alarms: Math.floor(randomValue(1, 4)),
      esd_status: 'inactive',
      esd_reason: 'Henüz ESD tetiklenmedi.',
      esd_triggered_at: null
    },
    personnel: {
      total: 34,
      evacuated: 3,
      safe: 31
    },
    simulator: {
      temp_zone1: randomValue(18, 35),
      gas_h2s_zone1: randomValue(0, 10),
      humidity_zone2: randomValue(40, 60),
      vibration_motor1: randomValue(1, 5)
    },
    personnel_logs: [
      { username: 'veli.koc', location: 'Zone 1', signal: -65, safe: false, last_seen: '14:23:11' },
      { username: 'ali.can', location: 'Gate A', signal: -80, safe: true, last_seen: '14:22:15' }
    ],
    financial: {
      daily_revenue: randomValue(45000, 58000),
      daily_gross_profit: randomValue(12000, 18000),
      net_profit_margin_pct: randomValue(18, 26),
      roi_pct: randomValue(4.2, 6.8),
      metrics: [
        { name: 'Günlük Gelir', value: 52000 },
        { name: 'Brüt Kar', value: 14500 }
      ]
    },
    generated_at: new Date().toISOString()
  }
}

function getSparkline(target: number) {
  return Array.from({ length: 10 }, (_, index) => Number((target + Math.sin(index / 2) * (target * 0.06)).toFixed(1)))
}

function buildTrendDataset(values: number[]) {
  return {
    labels: values.map((_, index) => `${index}`),
    datasets: [{
      data: values,
      borderColor: 'var(--accent)',
      backgroundColor: 'rgba(0, 212, 255, 0.18)',
      fill: true,
      tension: 0.35,
      pointRadius: 0
    }]
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '---'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('tr-TR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit' 
    })
  } catch { return iso }
}

function App() {
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('socar-theme', 'dark')
  const [user, setUser] = useLocalStorage<string | null>('socar-user', null)
  const [token, setToken] = useLocalStorage<string | null>('socar-token-v2', null)
  const [userId, setUserId] = useLocalStorage<string | null>('socar-user-id', null)
  const isAuthenticated = !!token && !!user
  const [selectedPage, setSelectedPage] = useState('dashboard')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [range, setRange] = useState(60)
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([])
  const [selectedLiveMetrics, setSelectedLiveMetrics] = useState<string[]>(['Temp-Zone1', 'Electricity', 'Pipeline-Pressure'])
  const [liveHistoryStore, setLiveHistoryStore] = useState<Record<string, {x: number, y: number}[]>>({})
  const [connectivity, setConnectivity] = useState<{ status: string; latency: number | null }>({ status: 'Bağlanıyor', latency: null })
  const [announcements, setAnnouncements] = useState<any[]>([])
  
  // Profil Düzenleme State'leri
  const [newUsername, setNewUsername] = useState(user || '')
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' })

  // 🆕 Kayıt Sistemi State'leri
  const [registrationTokens, setRegistrationTokens] = useLocalStorage<any[]>('socar-reg-tokens', [])
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [userRole, setUserRole] = useLocalStorage<string>('socar-user-role', 'Operatör')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements`)
      const data = await res.json()
      setAnnouncements(data)
    } catch (e) {
      // Fallback Duyurular
      setAnnouncements([
        { id: 1, title: 'Sistem Güncellemesi', content: 'SOCKET v1.0.1 yayına alındı. Performans iyileştirmeleri yapıldı.', type: 'info', created_at: new Date().toISOString() },
        { id: 2, title: 'Güvenlik Uyarısı', content: 'Zone-3 bölgesindeki sensör bakımları tamamlanmıştır.', type: 'warning', created_at: new Date().toISOString() }
      ])
    }
  }

  useEffect(() => {
    if (selectedPage === 'notifications') {
      fetchAnnouncements()
    }
  }, [selectedPage])

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/home/metrics/list`)
      const data = await res.json()
      setAvailableMetrics(data)
    } catch (e) {
      console.error("Metric list error", e)
    }
  }

  const fetchOverview = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`${API_BASE}/api/home/overview`, { 
        cache: 'no-cache',
        signal: AbortSignal.timeout(4000) // 4 saniye timeout
      })
      if (!response.ok) throw new Error('Network error')
      const data = (await response.json()) as Overview
      setOverview(data)
      
      // Live History Store Güncelleme
      updateLiveHistory(data)

      if (data?.status === 'online') {
        setConnectivity({ status: 'Online', latency: Math.round(Math.random() * 24 + 10) })
      }
    } catch (error) {
      console.error("Overview fetch failed:", error)
      const fallback = fallbackData() as Overview
      setOverview((prev: Overview | null) => prev || fallback)
      updateLiveHistory(fallback)
      setConnectivity({ status: 'Çevrimdışı', latency: null })
    } finally {
      setIsLoading(false)
      setTimeout(() => setIsUpdating(false), 800)
    }
  }

  const updateLiveHistory = (data: Overview) => {
    const timestamp = Math.floor(Date.now() / 1000)
    setLiveHistoryStore((prev: Record<string, {x: number, y: number}[]>) => {
      const newStore = { ...prev }
      
      // Tüm kategorilerdeki metrikleri tara ve seçili olanları bul
      const allValues: Record<string, number> = {}
      
      // Simulator
      if (data.simulator) Object.entries(data.simulator).forEach(([k, v]) => allValues[k] = v as number)
      // Energy
      if (data.energy?.metrics) data.energy.metrics.forEach((m: any) => allValues[m.label] = m.value)
      if (data.energy) {
        allValues['Electricity'] = data.energy.electricity_kwh
        allValues['Steam'] = data.energy.steam_tons
        allValues['Water'] = data.energy.water_m3
      }
      // Environment
      if (data.environment) {
        allValues['Temperature'] = data.environment.current_weather?.temperature ?? data.environment.temperature ?? 0
        allValues['Humidity'] = data.environment.current_weather?.humidity ?? data.environment.humidity ?? 0
        allValues['Pressure'] = data.environment.current_weather?.pressure ?? data.environment.pressure ?? 0
        allValues['Signal'] = data.environment.signal ?? -65
      }
      // Production
      if (data.production?.metrics) {
        Object.entries(data.production.metrics).forEach(([k, v]: [string, any]) => allValues[k] = v.value || 0)
      }
      // Financial
      if (data.financial?.metrics) {
        data.financial.metrics.forEach((m: any) => {
          const idMap: Record<string, string> = {
            "Günlük Gelir": "Revenue",
            "Brüt Kar": "Gross-Profit",
            "Operasyonel Maliyet": "Operating-Cost",
            "ROI": "ROI"
          }
          const id = idMap[m.name] || m.name
          allValues[id] = m.value || 0
        })
      }

      selectedLiveMetrics.forEach(id => {
        const val = allValues[id] ?? 0
        const currentPoints = newStore[id] || []
        const nextPoints = [...currentPoints, { x: timestamp, y: val }].slice(-60) // Son 60 nokta
        newStore[id] = nextPoints
      })

      return newStore
    })
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    fetchOverview()
    const interval = window.setInterval(fetchOverview, 5000)
    return () => window.clearInterval(interval)
  }, [selectedLiveMetrics])

  const toggleLiveMetric = (id: string) => {
    setSelectedLiveMetrics(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    )
  }

  const handleLogin = (username: string, token: string, role?: string, id?: string) => {
    setUser(username)
    setToken(token)
    setUserId(id || null)
    
    // 🛡️ Yetkiyi sadece ID üzerinden kontrol et
    if (id === '99999999999') {
      setUserRole('Geliştirici')
    } else if (role) {
      setUserRole(role)
    } else {
      setUserRole('Operatör')
    }
  }

  // 🧹 SİSTEM TEMİZLİĞİ: Yeni ID sistemine geçiş için temizlik
  useEffect(() => {
    const isCleaned = localStorage.getItem('socar-system-reset-v3');
    if (!isCleaned) {
      localStorage.removeItem('socar-registered-users');
      localStorage.removeItem('socar-reg-tokens');
      localStorage.setItem('socar-system-reset-v3', 'true');
      console.log('Sistem ID Altyapısına Hazırlandı.');
    }
  }, []);

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setUserId(null)
    setUserRole('Operatör') // Çıkışta yetkiyi en alt seviyeye çek
  }

  if (!isAuthenticated && selectedPage !== 'help' && selectedPage !== 'privacy') {
    return (
      <LoginPage 
        onLogin={handleLogin} 
        onShowHelp={() => setSelectedPage('help')} 
        onShowPrivacy={() => setSelectedPage('privacy')}
        registrationTokens={registrationTokens}
      />
    )
  }

  const displayOverview = overview || fallbackData()



  const pageTitle = MENU.flatMap(section => section.items).find(item => item.id === selectedPage)?.label ?? 'Dashboard'

  return (
    <div className="app-shell" data-theme={theme}>
      {isAuthenticated && (
        <Sidebar 
          menu={MENU} 
          selected={selectedPage} 
          onSelect={setSelectedPage} 
          theme={theme} 
          toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
      )}
      <main className="page-content">
        {isAuthenticated && (
          <header className="page-header slide-in" style={{ zIndex: 1001, position: 'relative' }}>
            <div className="header-left" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <button className="mobile-toggle" onClick={() => document.body.classList.toggle('sidebar-open')}>
                <Menu size={20} />
              </button>
              <div className="header-title-group">
                <h1 className="header-title">SOCKET</h1>
                <div className="header-subtitle-group">
                  <span className="header-subtitle">Endüstriyel Veri ve Operasyon Paneli</span>
                </div>
              </div>
            </div>
            
            <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div className="header-weather-metrics" style={{ display: 'flex', gap: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1.5rem' }}>
                {overview?.environment?.current_weather && (
                  <>
                    <div className="header-metric-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Thermometer size={16} style={{ color: '#00d4ff' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{overview.environment.current_weather.temperature}°C</span>
                    </div>
                    <div className="header-metric-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Droplets size={16} style={{ color: '#00ff9d' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>%{overview.environment.current_weather.humidity}</span>
                    </div>
                  </>
                )}
              </div>

              <div className={`status-badge ${connectivity.status === 'Online' ? 'online' : 'offline'}`} style={{ 
                display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', 
                padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 
              }}>
                <div className="status-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: connectivity.status === 'Online' ? '#10b981' : '#ef4444' }} />
                <span>{connectivity.status}</span>
                {connectivity.latency && <span style={{ opacity: 0.5, marginLeft: '0.2rem' }}>{connectivity.latency}ms</span>}
              </div>

              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Temayı Değiştir" style={{
                  height: '48px', padding: '0 1rem', borderRadius: '14px', 
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', 
                  color: theme === 'dark' ? '#fff' : '#0f172a', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  transition: '0.2s'
                }}>
                  {theme === 'dark' ? <SunMedium size={20} /> : <Moon size={20} />}
                </button>
                <UserMenu 
                username={user || ''} 
                userRole={userRole}
                onLogout={handleLogout} 
                onNavigate={setSelectedPage}
                theme={theme}
              />
</div>
            </div>
          </header>
        )}

        {isLoading ? (
          <div className="grid-layout">
            {Array.from({ length: 6 }).map((_, idx) => <LoadingSkeleton key={idx} />)}
          </div>
        ) : (
          <>
            {selectedPage === 'dashboard' && (
              <div className="dashboard-grid">
                {/* 1. Operasyon Özeti (4/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 4' }}>
                  <div className="panel-header">
                    <h2>Operasyon Özeti</h2>
                    <Activity size={16} />
                  </div>
                  <div className="info-list" style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ margin: 0 }}>
                      <span>Personel</span>
                      <strong>{displayOverview.personnel?.total ?? 0}</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>Verimlilik</span>
                      <strong style={{ color: 'var(--accent)' }}>%{displayOverview.energy?.efficiency_pct ?? 0}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Finansal KPI (4/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 4' }}>
                  <div className="panel-header">
                    <h2>Finansal Durum</h2>
                    <CircleDollarSign size={16} />
                  </div>
                  <div className="info-list" style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ margin: 0 }}>
                      <span>Günlük Gelir</span>
                      <strong style={{ color: '#10b981' }}>${(displayOverview.financial?.daily_revenue || 0).toLocaleString()}</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>Brüt Kar</span>
                      <strong style={{ color: 'var(--accent)' }}>${(displayOverview.financial?.daily_gross_profit || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Güvenlik & Alarmlar (4/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 4' }}>
                  <div className="panel-header">
                    <h2>Sistem Güvenliği</h2>
                    <ShieldAlert size={16} color={displayOverview.safety?.active_alarms > 0 ? '#ef4444' : 'var(--accent)'} />
                  </div>
                  <div className="info-list" style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ margin: 0, border: displayOverview.safety?.active_alarms > 0 ? '1px solid #ef4444' : '' }}>
                      <span>Aktif Alarm</span>
                      <strong style={{ color: displayOverview.safety?.active_alarms > 0 ? '#ef4444' : '#10b981' }}>{displayOverview.safety?.active_alarms ?? 0}</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>ESD</span>
                      <strong style={{ color: displayOverview.safety?.esd_status === 'active' ? '#ef4444' : '#10b981' }}>{displayOverview.safety?.esd_status?.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Simülatör Verileri (6/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 6' }}>
                  <div className="panel-header">
                    <h2>Kritik Simülatör Sensörleri</h2>
                    <SlidersHorizontal size={16} />
                  </div>
                  <div className="kpi-grid" style={{ marginTop: '0.75rem', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    <div className="kpi-box">
                      <span>Bölge 1 Isı</span>
                      <strong style={{ color: 'var(--accent)' }}>{displayOverview.simulator?.temp_zone1 ?? 0}°C</strong>
                    </div>
                    <div className="kpi-box">
                      <span>H2S Gazı</span>
                      <strong style={{ color: '#ff3c50' }}>{displayOverview.simulator?.gas_h2s_zone1 ?? 0} ppm</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Titreşim</span>
                      <strong style={{ color: '#ffb400' }}>{displayOverview.simulator?.vibration_motor1 ?? 0} mm/s</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Üretim Hattı (6/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 6' }}>
                  <div className="panel-header">
                    <h2>Üretim Hattı Akışı</h2>
                    <BarChart2 size={16} />
                  </div>
                  <div className="kpi-grid" style={{ marginTop: '0.75rem', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    <div className="kpi-box">
                      <span>Akış Hızı</span>
                      <strong style={{ color: 'var(--accent)' }}>{displayOverview.production?.metrics?.['Flow-Rate']?.value?.toFixed(1) ?? 0}</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Boru Basıncı</span>
                      <strong style={{ color: '#10b981' }}>{displayOverview.production?.metrics?.['Pipeline-Pressure']?.value?.toFixed(1) ?? 0} bar</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Tank Seviyesi</span>
                      <strong style={{ color: '#00d4ff' }}>%{displayOverview.production?.metrics?.['Tank-Alpha-Level']?.value?.toFixed(0) ?? 0}</strong>
                    </div>
                  </div>
                </div>

                {/* 6. Lojistik & Stok (6/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 6' }}>
                  <div className="panel-header">
                    <h2>Lojistik & Envanter</h2>
                    <Users size={16} />
                  </div>
                  <div className="info-list" style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ margin: 0 }}>
                      <span>Depo Kullanımı</span>
                      <strong>%{displayOverview.logistics?.warehouse_utilization_pct ?? 0}</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>Envanter</span>
                      <strong style={{ color: '#10b981' }}>{displayOverview.logistics?.inventory_status}</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>Aktif Gemi</span>
                      <strong style={{ fontSize: '0.8rem' }}>{displayOverview.logistics?.current_ship}</strong>
                    </div>
                  </div>
                </div>

                {/* 7. Çevresel Veriler (6/12) */}
                <div className="panel card compact fade-in-up" style={{ gridColumn: 'span 6' }}>
                  <div className="panel-header">
                    <h2>Çevresel İzleme</h2>
                    <Cloud size={16} />
                  </div>
                  <div className="info-list" style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ margin: 0 }}>
                      <span>Hava Kalitesi</span>
                      <strong style={{ color: '#10b981' }}>{displayOverview.environment?.air_quality?.measurements?.[0]?.value ?? 0} PM2.5</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>Sinyal Gücü</span>
                      <strong style={{ color: 'var(--accent)' }}>{displayOverview.environment?.signal} dBm</strong>
                    </div>
                    <div style={{ margin: 0 }}>
                      <span>Konum</span>
                      <strong style={{ fontSize: '0.8rem' }}>Aliağa, TR</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'live' && (
              <div className="live-monitor-layout">
                <div className="panel card fade-in-up live-selection-panel" style={{ marginBottom: '1.5rem' }}>
                  <div className="panel-header">
                    <h2>Canlı İzleme Paneli</h2>
                    <Activity size={18} />
                  </div>
                  <p className="panel-description">İzlemek istediğiniz metrikleri seçin. Veriler 5 saniyelik periyotlarla güncellenmektedir.</p>
                  <LiveMetricSelector 
                    availableMetrics={availableMetrics}
                    selectedMetrics={selectedLiveMetrics}
                    onToggle={toggleLiveMetric}
                  />
                </div>

                <div className="live-charts-grid">
                  {selectedLiveMetrics.length > 0 ? (
                    selectedLiveMetrics.map(id => {
                      const metric = availableMetrics.find(m => m.id === id)
                      const data = liveHistoryStore[id] || []
                      return (
                        <div key={id} className="panel card fade-in" style={{ padding: '1rem' }}>
                          <TimeSeriesPanel
                            title={metric?.name || id}
                            data={data}
                            range={60}
                            onChangeRange={() => {}}
                            color={metric?.color}
                          />
                        </div>
                      )
                    })
                  ) : (
                    <div className="placeholder-state">
                      <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>İzlemek için metrik seçin</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedPage === 'charts' && (
              <div className="card fade-in-up" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Bu sayfa (Grafikler & Trendler) şuanlık eklenmedi.</p>
              </div>
            )}

            {selectedPage === 'map' && <InteractiveMapPage />}
            {selectedPage === 'analysis' && <GraphAnalysisPage />}

            {selectedPage === 'production' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width">
                  <div className="panel-header">
                    <h2>Üretim İzleme</h2>
                    <SlidersHorizontal size={18} />
                  </div>
                  <div className="status-summary-row">
                    <div>
                      <span>Sistem Durumu</span>
                      <strong style={{ color: '#10b981' }}>{displayOverview.production?.status?.toUpperCase() || 'AKTİF'}</strong>
                    </div>
                  </div>
                  <div className="info-list" style={{ marginTop: '1.25rem' }}>
                    {Object.entries(displayOverview.production?.metrics || {}).map(([key, m]: [string, any]) => (
                      <div key={key}>
                        <span>{key.replace(/-/g, ' ')}</span>
                        <strong>{m.value ?? '--'} {m.unit} <small style={{ opacity: 0.5, marginLeft: 4, fontSize: '0.75rem' }}>({m.min}-{m.max})</small></strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'environment' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width">
                  <div className="panel-header">
                    <h2>Çevresel İzleme</h2>
                    <Cloud size={18} />
                  </div>
                  <div className="status-summary-row">
                    <div>
                      <span>Konum</span>
                      <strong>{displayOverview.environment?.location ?? 'Aliağa, İzmir'}</strong>
                    </div>
                    <div>
                      <span>Sıcaklık</span>
                      <strong>{displayOverview.environment?.temperature ?? 31} °C</strong>
                    </div>
                    <div>
                      <span>Nem</span>
                      <strong>{displayOverview.environment?.humidity ?? 56}%</strong>
                    </div>
                    <div>
                      <span>Basınç</span>
                      <strong>{displayOverview.environment?.pressure ?? 1018} hPa</strong>
                    </div>
                  </div>
                  <div className="info-list" style={{ marginTop: '1.25rem' }}>
                    <div>
                      <span>Hava Kalitesi</span>
                      <strong>{displayOverview.environment.air_quality?.measurements?.[0]?.parameter ?? 'Bilinmiyor'}</strong>
                    </div>
                    <div>
                      <span>Kalite Değeri</span>
                      <strong>{displayOverview.environment.air_quality?.measurements?.[0]?.value ?? '--'}</strong>
                    </div>
                    <div>
                      <span>Güncelleme</span>
                      <strong>{displayOverview.environment?.air_quality?.last_updated ? formatDate(displayOverview.environment.air_quality.last_updated) : 'Son dakika'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'personnel' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width">
                  <div className="panel-header">
                    <h2>Personel Takibi</h2>
                    <Users size={18} />
                  </div>
                  <div className="status-summary-row">
                    <div>
                      <span>Toplam Personel</span>
                      <strong>{displayOverview.personnel?.total ?? 34}</strong>
                    </div>
                    <div>
                      <span>Güvende</span>
                      <strong>{displayOverview.personnel?.safe ?? 28}</strong>
                    </div>
                    <div>
                      <span>Tahliye Edildi</span>
                      <strong>{displayOverview.personnel?.evacuated ?? 6}</strong>
                    </div>
                  </div>
                  <div className="info-list" style={{ marginTop: '1.25rem' }}>
                    <div>
                      <span>Son güncelleme</span>
                      <strong>{formatDate(displayOverview.generated_at)}</strong>
                    </div>
                    <div>
                      <span>Güvenlik Alarmı</span>
                      <strong>{displayOverview.safety?.esd_status === 'active' ? 'Acil Tahliye' : 'Normal'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'alarms' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width alarm-card">
                  <div className="panel-header">
                    <h2>Alarm Geçmişi</h2>
                    <ShieldAlert size={18} />
                  </div>
                  <div className="kpi-grid">
                    <div className="kpi-box">
                      <span>Aktif Alarm</span>
                      <strong>{displayOverview.safety?.active_alarms ?? 3}</strong>
                    </div>
                    <div className="kpi-box">
                      <span>ESD Durumu</span>
                      <strong>{displayOverview.safety?.esd_status ?? 'inactive'}</strong>
                    </div>
                    <div className="kpi-box">
                      <span>Son Alarm</span>
                      <strong>{displayOverview.safety?.esd_reason ?? 'Gaz Kaçağı Tespiti'}</strong>
                    </div>
                  </div>
                  <div className="info-list" style={{ marginTop: '1.25rem' }}>
                    <div>
                      <span>En son tetiklenme</span>
                      <strong>{displayOverview.safety?.esd_triggered_at ? formatDate(displayOverview.safety.esd_triggered_at) : 'Henüz tetiklenmedi'}</strong>
                    </div>
                    <div>
                      <span>Durum</span>
                      <strong>{displayOverview.safety?.esd_status === 'active' ? 'Acil' : 'Stabil'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'profile' && (
              <div className="fade-in-up" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <div className="panel card">
                  <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
                    <h2>Hesap Yönetimi</h2>
                    <User size={20} />
                  </div>
                  
                  {updateStatus.type && (
                    <div style={{ padding: '1rem', borderRadius: '12px', background: updateStatus.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)', border: `1px solid ${updateStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'}`, marginBottom: '1.5rem', color: updateStatus.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {updateStatus.type === 'success' ? <RefreshCw size={16} /> : <AlertTriangle size={16} />}
                      {updateStatus.msg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Profil Bilgileri */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent), #1b2d58)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {user?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.4rem' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Görünen İsim</label>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontFamily: 'monospace', opacity: 0.8 }}>ID: {userId || 'Tanımlanmadı'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            className="button" 
                            style={{ flex: 1, background: 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'text' }}
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                          />
                          <button 
                            className="button button-primary" 
                            style={{ padding: '0 1.5rem' }}
                            onClick={() => {
                              if (!newUsername.trim()) return;
                              // Kayıtlı kullanıcılarda güncelle
                              const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
                              const userIdx = users.findIndex((u: any) => u.userId === userId); // ID üzerinden bulmak daha güvenli
                              if (userIdx !== -1) {
                                users[userIdx].username = newUsername;
                                localStorage.setItem('socar-registered-users', JSON.stringify(users));
                              }
                              setUser(newUsername);
                              setUpdateStatus({ type: 'success', msg: 'Görünen isim başarıyla güncellendi.' });
                              setTimeout(() => setUpdateStatus({ type: null, msg: '' }), 3000);
                            }}
                          >
                            Güncelle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Şifre Değiştirme */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={16} /> Şifre Değiştir
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Mevcut Şifre</label>
                          <input 
                            type="password" 
                            className="button" 
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'text' }}
                            placeholder="Mevcut şifrenizi girin"
                            value={passwords.old}
                            onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Yeni Şifre</label>
                            <input 
                              type="password" 
                              className="button" 
                              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'text' }}
                              placeholder="••••••••"
                              value={passwords.new}
                              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Şifre Onay</label>
                            <input 
                              type="password" 
                              className="button" 
                              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', textAlign: 'left', cursor: 'text' }}
                              placeholder="••••••••"
                              value={passwords.confirm}
                              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                          </div>
                        </div>
                        <button 
                          className="button" 
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                          onClick={() => {
                            const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
                            // Admin için varsayılan şifreyi adminadmin olarak düzelttim
                            const currentUserData = users.find((u: any) => u.username === user) || { password: 'adminadmin' };

                            if (passwords.old !== currentUserData.password) {
                              setUpdateStatus({ type: 'error', msg: 'Mevcut şifreniz hatalı.' });
                            } else if (passwords.new !== passwords.confirm) {
                              setUpdateStatus({ type: 'error', msg: 'Yeni şifreler eşleşmiyor.' });
                            } else if (passwords.new.length < 4) {
                              setUpdateStatus({ type: 'error', msg: 'Şifre çok kısa (min 4 karakter).' });
                            } else {
                              // Şifreyi kaydet veya admin'i listeye ekle
                              const userIdx = users.findIndex((u: any) => u.username === user);
                              if (userIdx !== -1) {
                                users[userIdx].password = passwords.new;
                              } else {
                                users.push({ username: user, password: passwords.new, level: userRole });
                              }
                              localStorage.setItem('socar-registered-users', JSON.stringify(users));
                              
                              setUpdateStatus({ type: 'success', msg: 'Şifreniz başarıyla değiştirildi ve kaydedildi.' });
                              setPasswords({ old: '', new: '', confirm: '' });
                            }
                            setTimeout(() => setUpdateStatus({ type: null, msg: '' }), 4000);
                          }}
                        >
                          Güvenli Şifre Güncelleme
                        </button>
                      </div>
                    </div>

                    {/* Bilgi Kartı */}
                    <div style={{ background: 'rgba(0, 212, 255, 0.05)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                      <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>Güvenlik Notu:</strong> Hesabınız SOCAR merkezi kimlik doğrulama sistemine bağlıdır. Şifre değişiklikleri tüm bağlı servisleri etkileyebilir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'settings' && (
              <div className="fade-in-up" style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
                <div className="panel card">
                  <div className="panel-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ margin: 0 }}>Sistem Ayarları</h2>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase' }}>Mevcut Yetki: {userRole}</span>
                    </div>
                    <Settings2 size={20} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Görünüm ve Tema */}
                    <section>
                      <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Görünüm ve Arayüz</h3>
                      <div className="info-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ margin: 0 }}>Karanlık Tema</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Göz yorgunluğunu azaltmak için gece modu</p>
                          </div>
                          <button className={`button ${theme === 'dark' ? 'button-primary' : ''}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                            {theme === 'dark' ? 'Aktif' : 'Etkinleştir'}
                          </button>
                        </div>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ margin: 0 }}>Arayüz Ölçeği</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Kartların ve yazıların yoğunluk seviyesi</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="button" style={{ padding: '0.4rem 1rem' }}>Kompakt</button>
                            <button className="button button-primary" style={{ padding: '0.4rem 1rem' }}>Standart</button>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Veri ve Performans */}
                    <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Veri ve Performans</h3>
                      <div className="info-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ margin: 0 }}>Veri Yenileme Hızı</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Sensör verilerinin saniye bazlı güncelleme sıklığı</p>
                          </div>
                          <select className="button" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}>
                            <option>1 Saniye (Gerçek Zamanlı)</option>
                            <option selected>5 Saniye (Önerilen)</option>
                            <option>15 Saniye (Enerji Tasarrufu)</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* 🆕 Kullanıcı Yönetimi (Admin Only) */}
                    {(userRole === 'Birim Yöneticisi' || userRole === 'Geliştirici') && (
                      <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kullanıcı Yönetimi & Davet</h3>
                        <div className="panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                          {/* 🛡️ GELİŞTİRİCİ DENETİM TERMİNALİ: Arthur için Kullanıcı Listesi */}
                          {userId === '99999999999' && (
                            <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.85rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <Shield size={16} color="var(--accent)" /> GELİŞTİRİCİ DENETİM TERMİNALİ
                                </h4>
                                <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>SUPER-ADMIN</span>
                              </div>
                              
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                  <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                      <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Kullanıcı</th>
                                      <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Yetki</th>
                                      <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Şifre</th>
                                      <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>İşlemler</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {JSON.parse(localStorage.getItem('socar-registered-users') || '[]').map((u: any) => (
                                      <tr key={u.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: '0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                          <div style={{ color: '#fff', fontWeight: 600 }}>{u.username}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontFamily: 'monospace' }}>ID: {u.userId}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                          <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {u.level || 'Operatör'}
                                          </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                                          <span title="Şifreyi Göster" style={{ cursor: 'pointer', color: 'var(--accent)', letterSpacing: '0.1em' }} onClick={() => alert(`${u.username} şifresi: ${u.password}`)}>
                                            ••••••
                                          </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="button" style={{ padding: '0.4rem 0.8rem', minHeight: 'auto', fontSize: '0.75rem' }} onClick={() => {
                                              const n = prompt('Yeni İsim:', u.username);
                                              const r = prompt('Yeni Rol (Operatör, Saha Mühendisi, Yönetici):', u.level || 'Operatör');
                                              const p = prompt('Yeni Şifre (Boş bırakırsanız değişmez):');
                                              
                                              if (n !== null || r !== null || p !== null) {
                                                const us = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
                                                const i = us.findIndex((x: any) => x.userId === u.userId);
                                                if (i !== -1) { 
                                                  if(n) us[i].username = n; 
                                                  if(r) us[i].level = r; 
                                                  if(p) us[i].password = p;
                                                  localStorage.setItem('socar-registered-users', JSON.stringify(us)); 
                                                  window.location.reload(); 
                                                }
                                              }
                                            }}>Düzenle</button>
                                            <button className="button" style={{ padding: '0.4rem 0.8rem', minHeight: 'auto', fontSize: '0.75rem', color: '#ff4d4d', background: 'rgba(255,77,77,0.05)' }} onClick={() => {
                                              if (u.userId === '99999999999') return;
                                              if (confirm(`${u.username} sistemden silinecek?`)) {
                                                const us = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
                                                localStorage.setItem('socar-registered-users', JSON.stringify(us.filter((x: any) => x.userId !== u.userId)));
                                                window.location.reload();
                                              }
                                            }}>Sil</button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', marginTop: '1.5rem' }}>Yeni bir personel kaydı için davetiye token'ı üretin.</p>
                          
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Kıdem Seviyesi</label>
                              <select 
                                id="reg-level" 
                                className="button" 
                                style={{ 
                                  width: '100%', 
                                  background: '#1a1e2e', 
                                  color: '#fff', 
                                  border: '1px solid var(--border-color)',
                                  cursor: 'pointer',
                                  paddingRight: '2rem',
                                  borderRadius: '14px',
                                  colorScheme: 'dark' 
                                }}
                              >
                                <option value="Operatör">Operatör</option>
                                <option value="Saha Mühendisi">Saha Mühendisi</option>
                                <option value="Yönetici">Birim Yöneticisi</option>
                                {userRole === 'Geliştirici' && (
                                  <option value="Geliştirici" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Geliştirici (Özel Yetki)</option>
                                )}
                              </select>
                              <style>{`
                                #reg-level option {
                                  background-color: #1a1e2e !important;
                                  color: white !important;
                                }
                              `}</style>
                            </div>
                              <button 
                                className="button button-primary" 
                                style={{ height: '48px' }}
                                onClick={() => {
                                  const level = (document.getElementById('reg-level') as HTMLSelectElement).value;
                                  const levelCode = level === 'Operatör' ? 'OP' : level === 'Saha Mühendisi' ? 'EN' : level === 'Geliştirici' ? 'DV' : 'MG';
                                  const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
                                  const token = `SOCAR-${levelCode}-${randomStr}`;
                                  setRegistrationTokens([...registrationTokens, { token, level, used: false }]);
                                  setGeneratedToken(token);
                                }}
                              >
                                Token Üret
                              </button>
                          </div>

                          {generatedToken && (
                            <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '12px', border: '1px dashed var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', display: 'block' }}>Üretilen Kayıt Kodu:</span>
                                <strong style={{ fontSize: '1.2rem', letterSpacing: '2px' }}>{generatedToken}</strong>
                              </div>
                              <button className="button btn-sm" onClick={() => {
                                navigator.clipboard.writeText(generatedToken);
                                alert('Token kopyalandı!');
                              }}>Kopyala</button>
                            </div>
                          )}

                          <div style={{ marginTop: '1.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aktif Bekleyen Tokenlar: {registrationTokens.filter(t => !t.used).length}</span>
                          </div>
                        </div>
                      </section>
                    )}
                    <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bildirim ve Uyarılar</h3>
                      <div className="info-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ margin: 0, fontSize: '0.85rem' }}>Kritik Alarmlar</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ margin: 0, fontSize: '0.85rem' }}>Sistem Duyuruları</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ margin: 0, fontSize: '0.85rem' }}>E-Posta Özetleri</span>
                          <input type="checkbox" />
                        </div>
                        <div className="kpi-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ margin: 0, fontSize: '0.85rem' }}>AI Önerileri</span>
                          <input type="checkbox" defaultChecked />
                        </div>
                      </div>
                    </section>

                    {/* 🛡️ GELİŞTİRİCİ ÖZEL: Merkezi Kullanıcı Denetimi */}
                    {userRole === 'Geliştirici' && (
                      <section style={{ borderTop: '1px solid var(--accent)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent)', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>🛡️ Geliştirici Denetim Terminali</h3>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: 'var(--accent)', color: '#000' }}>SUPER-ADMIN</span>
                        </div>
                        <div className="panel" style={{ background: 'rgba(0, 212, 255, 0.03)', borderRadius: '24px', border: '1px solid rgba(0, 212, 255, 0.2)', padding: '1.5rem' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Sistemdeki tüm kayıtlı kullanıcıların yönetimi:</p>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                  <th style={{ padding: '0.75rem' }}>Kullanıcı</th>
                                  <th style={{ padding: '0.75rem' }}>Yetki</th>
                                  <th style={{ padding: '0.75rem' }}>Şifre</th>
                                  <th style={{ padding: '1rem', textAlign: 'right' }}>İşlem</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(JSON.parse(localStorage.getItem('socar-registered-users') || '[]')).map((u: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{u.username}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: u.level === 'Geliştirici' ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: u.level === 'Geliştirici' ? '#000' : '#fff', fontSize: '0.7rem' }}>
                                        {u.level}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--accent)' }}>{u.password}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                      <button className="button btn-sm" style={{ padding: '4px 12px', fontSize: '0.7rem', borderRadius: '8px' }} onClick={() => {
                                        const newPass = prompt(`${u.username} için yeni şifre:`, u.password);
                                        if (newPass) {
                                          const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
                                          const userIdx = users.findIndex((usr: any) => usr.username === u.username);
                                          if (userIdx !== -1) {
                                            users[userIdx].password = newPass;
                                            localStorage.setItem('socar-registered-users', JSON.stringify(users));
                                            alert('Şifre güncellendi!');
                                            window.location.reload();
                                          }
                                        }
                                      }}>Düzenle</button>
                                      <button className="button btn-sm" style={{ marginLeft: '0.5rem', background: 'rgba(255,0,0,0.1)', color: 'red', border: '1px solid rgba(255,0,0,0.2)' }} onClick={() => {
                                        if (confirm(`${u.username} kullanıcısını silmek istediğinize emin misiniz?`)) {
                                          const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
                                          const filtered = users.filter((usr: any) => usr.username !== u.username);
                                          localStorage.setItem('socar-registered-users', JSON.stringify(filtered));
                                          window.location.reload();
                                        }
                                      }}>Sil</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Uygulama Bilgisi */}
                    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        SOCKET Industrial Platform v1.2.5 <br/> 
                        Son Sunucu Senkronizasyonu: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'notifications' && (
              <div className="fade-in-up" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <div className="panel card">
                  <div className="panel-header" style={{ marginBottom: '1.5rem' }}>
                    <h2>Duyurular ve Bildirimler</h2>
                    <Bell size={20} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {announcements.length > 0 ? announcements.map((ann: any) => (
                      <div key={ann.id} style={{ padding: '1.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${ann.type === 'warning' ? 'rgba(245,158,11,0.2)' : 'var(--border-color)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <strong style={{ color: ann.type === 'warning' ? 'var(--warning)' : 'var(--accent)' }}>{ann.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatDate(ann.created_at)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>{ann.content}</p>
                      </div>
                    )) : (
                      <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Henüz yeni bir duyuru bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>
            )}



            {selectedPage === 'status' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width">
                  <div className="panel-header">
                    <h2>Bağlantı Durumu</h2>
                    <Settings2 size={18} />
                  </div>
                  <div className="status-summary-row">
                    <div>
                      <span>API Bağlantısı</span>
                      <strong>{connectivity.status}</strong>
                    </div>
                    <div>
                      <span>Gecikme</span>
                      <strong>{connectivity.latency ?? '--'} ms</strong>
                    </div>
                    <div>
                      <span>Sunucu</span>
                      <strong>{API_BASE}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'help' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width">
                  <div className="panel-header">
                    <h2>Yardım Merkezi</h2>
                    <HelpCircle size={18} />
                  </div>
                  <div className="help-content" style={{ padding: '1rem 0', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <h3>Sistem Özeti</h3>
                    <p style={{ marginTop: '0.5rem' }}>
                      <strong>SOCKET</strong>, endüstriyel tesislerin dijital ikizi üzerinden gerçek zamanlı izleme, personel güvenliği 
                      ve operasyonel verimlilik analizi yapan entegre bir takip platformudur. 
                      Sistem, sensörlerden gelen IoT verilerini anlamlandırarak kritik durumlarda erken uyarı sağlar.
                    </p>
                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0, 212, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
                      <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '0.5rem' }}>Erişim Bilgileri Hakkında</strong>
                      <p>
                        Sisteme giriş için gerekli kullanıcı adı ve şifre bilgileri, güvenlik politikalarımız gereği sadece 
                        yetkili birim sorumluları tarafından kurumsal e-posta yoluyla iletilmektedir.
                      </p>
                      <p style={{ marginTop: '1rem' }}>
                        Bilgi talebi veya teknik destek için <strong>it.support@socar.com.tr</strong> adresine veya 
                        ilgili departman yöneticinize başvurabilirsiniz.
                      </p>
                    </div>
                    {!isAuthenticated && (
                      <button 
                        onClick={() => setSelectedPage('dashboard')}
                        style={{ marginTop: '2rem', background: 'var(--accent)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Giriş Ekranına Dön
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedPage === 'privacy' && (
              <div className="grid-layout">
                <div className="panel card fade-in-up full-width">
                  <div className="panel-header">
                    <h2>Gizlilik ve Güvenlik Özellikleri</h2>
                    <Shield size={18} />
                  </div>
                  <div className="privacy-content" style={{ padding: '1rem 0', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <p>SOCKET, endüstriyel veri güvenliğini en üst seviyede tutmak için aşağıdaki özellikleri sunar:</p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ padding: '1rem', borderLeft: '3px solid var(--accent)', background: 'rgba(255,255,255,0.02)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Uçtan Uca Şifreleme:</strong>
                        <p>Tüm veri trafiği (MQTT, WebSockets, REST API) TLS/SSL protokolleri ile uçtan uca şifrelenmektedir.</p>
                      </div>
                      <div style={{ padding: '1rem', borderLeft: '3px solid var(--accent)', background: 'rgba(255,255,255,0.02)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Anonim Personel Takibi:</strong>
                        <p>BLE tabanlı konum verileri, personel mahremiyetini korumak adına anonimleştirilerek sadece güvenlik ihlallerinde eşleştirilir.</p>
                      </div>
                      <div style={{ padding: '1rem', borderLeft: '3px solid var(--accent)', background: 'rgba(255,255,255,0.02)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Yerel Veri Saklama:</strong>
                        <p>Tüm veriler kurum içi (on-premise) sunucularda saklanır; hiçbir veri bulut veya dış servislerle paylaşılmaz.</p>
                      </div>
                    </div>
                    {!isAuthenticated && (
                      <button 
                        onClick={() => setSelectedPage('dashboard')}
                        style={{ marginTop: '2rem', background: 'var(--accent)', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Giriş Ekranına Dön
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {isAuthenticated && (
          <AIAssistant 
            onNavigate={setSelectedPage} 
            systemStatus={overview} 
            toggleMetric={toggleLiveMetric}
            selectedMetrics={selectedLiveMetrics}
            token={token}
          />
        )}
        {isAuthenticated && <CrisisSimulator token={token} />}
      </main>

      {/* Mobile Overlay (Grid akışını bozmaması için sonda) */}
      <div 
        className="mobile-overlay" 
        onClick={() => document.body.classList.remove('sidebar-open')}
      />
    </div>
  )
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}
 
