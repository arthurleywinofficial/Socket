import { Maximize2, RefreshCcw, Calendar, ChevronDown, Check, LayoutGrid, BarChart3, LineChart, ZoomIn, Download, Trash2, Plus, PieChart, Activity } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Line, Bar, Radar, Pie } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { API_BASE } from '../config'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  zoomPlugin
)


interface Metric {
  id: string
  name: string
  unit: string
  color: string
}

export default function GraphAnalysisPage() {
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([
    // Üretim
    { id: 'Temp-Zone1', name: 'Sıcaklık - Bölge 1', unit: '°C', color: '#ff4d4d', category: 'Üretim' } as any,
    { id: 'Electricity', name: 'Elektrik Tüketimi', unit: 'kWh', color: '#00d4ff', category: 'Üretim' } as any,
    { id: 'Gas-Flow', name: 'Gaz Akış Hızı', unit: 'm³/sa', color: '#10b981', category: 'Üretim' } as any,
    { id: 'Vibration', name: 'Motor Titreşimi', unit: 'mm/s', color: '#f59e0b', category: 'Üretim' } as any,
    { id: 'Oil-Pressure', name: 'Yağ Basıncı', unit: 'bar', color: '#6366f1', category: 'Üretim' } as any,
    
    // Çevresel
    { id: 'Humidity', name: 'Nem Oranı', unit: '%', color: '#3b82f6', category: 'Çevresel' } as any,
    { id: 'Air-Quality', name: 'Hava Kalitesi (PM2.5)', unit: 'µg/m³', color: '#8b5cf6', category: 'Çevresel' } as any,
    { id: 'Noise-Level', name: 'Gürültü Seviyesi', unit: 'dB', color: '#ec4899', category: 'Çevresel' } as any,
    { id: 'Gas-H2S', name: 'H2S Gaz Seviyesi', unit: 'ppm', color: '#ef4444', category: 'Çevresel' } as any,
    
    // Lojistik
    { id: 'Water', name: 'Su Kullanımı', unit: 'm³', color: '#0ea5e9', category: 'Lojistik' } as any,
    { id: 'Tank-Level', name: 'Depo Doluluk Oranı', unit: '%', color: '#f97316', category: 'Lojistik' } as any,
    { id: 'Steam-Pressure', name: 'Buhar Basıncı', unit: 'psi', color: '#d946ef', category: 'Lojistik' } as any,
    
    // Güvenlik
    { id: 'Radiation', name: 'Radyasyon Dozu', unit: 'µSv/h', color: '#84cc16', category: 'Güvenlik' } as any,
    { id: 'Signal-Strength', name: 'Sinyal Gücü', unit: 'dBm', color: '#06b6d4', category: 'Güvenlik' } as any,
    { id: 'CPU-Load', name: 'Sistem Yükü', unit: '%', color: '#64748b', category: 'Güvenlik' } as any,
  ])
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Temp-Zone1', 'Electricity'])
  const [chartData, setChartData] = useState<any>(null)
  const [range, setRange] = useState(1) // hours
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(true)
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('Hepsi')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'radar' | 'pie'>('line')
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const chartRef = useRef<any>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    if (selectedMetrics.length > 0) {
      fetchHistoricalData()
    }
  }, [selectedMetrics, range])

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/home/metrics/list`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setAvailableMetrics(data)
      } else {
        throw new Error('Empty metrics')
      }
    } catch (e) {
      // 🛡️ Fallback Metrik Listesi (Expanded v1.2.0)
      const expandedMetrics = [
        { id: 'Temp-Zone1', name: 'Sıcaklık - Bölge 1', unit: '°C', color: '#ff4d4d', category: 'Üretim' },
        { id: 'Electricity', name: 'Elektrik Tüketimi', unit: 'kWh', color: '#00d4ff', category: 'Üretim' },
        { id: 'Gas-Flow', name: 'Gaz Akış Hızı', unit: 'm³/sa', color: '#10b981', category: 'Üretim' },
        { id: 'Vibration', name: 'Motor Titreşimi', unit: 'mm/s', color: '#f59e0b', category: 'Üretim' },
        { id: 'Oil-Pressure', name: 'Yağ Basıncı', unit: 'bar', color: '#6366f1', category: 'Üretim' },
        { id: 'Humidity', name: 'Nem Oranı', unit: '%', color: '#3b82f6', category: 'Çevresel' },
        { id: 'Air-Quality', name: 'Hava Kalitesi (PM2.5)', unit: 'µg/m³', color: '#8b5cf6', category: 'Çevresel' },
        { id: 'Noise-Level', name: 'Gürültü Seviyesi', unit: 'dB', color: '#ec4899', category: 'Çevresel' },
        { id: 'Gas-H2S', name: 'H2S Gaz Seviyesi', unit: 'ppm', color: '#ef4444', category: 'Çevresel' },
        { id: 'Water', name: 'Su Kullanımı', unit: 'm³', color: '#0ea5e9', category: 'Lojistik' },
        { id: 'Tank-Level', name: 'Depo Doluluk Oranı', unit: '%', color: '#f97316', category: 'Lojistik' },
        { id: 'Steam-Pressure', name: 'Buhar Basıncı', unit: 'psi', color: '#d946ef', category: 'Lojistik' },
        { id: 'Radiation', name: 'Radyasyon Dozu', unit: 'µSv/h', color: '#84cc16', category: 'Güvenlik' },
        { id: 'Signal-Strength', name: 'Sinyal Gücü', unit: 'dBm', color: '#06b6d4', category: 'Güvenlik' },
        { id: 'CPU-Load', name: 'Sistem Yükü', unit: '%', color: '#64748b', category: 'Güvenlik' },
      ];
      setAvailableMetrics(expandedMetrics as any);
    }
  }

  const fetchHistoricalData = async () => {
    setIsLoading(true)
    try {
      const datasets = await Promise.all(
        selectedMetrics.map(async (metricId) => {
          let url = `${API_BASE}/api/home/history?sensor=${metricId}`
          if (isCustomRange && customStart) {
            url += `&start=${new Date(customStart).toISOString()}`
            if (customEnd) url += `&end=${new Date(customEnd).toISOString()}`
          } else {
            url += `&hours=${range}`
          }
          
          // ⚡ Timeout Kontrolü: 1.5 saniye içinde cevap gelmezse fallback'e düş
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1500);

          try {
            const res = await fetch(url, { signal: controller.signal })
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json()
            if (!Array.isArray(data) || data.length === 0) throw new Error('No history data');
            
            const metricDetails = availableMetrics.find(m => m.id === metricId)
            
            return {
              label: metricDetails?.name || metricId,
              data: data.map((d: any) => ({ x: new Date(d.time), y: d.value })),
              borderColor: metricDetails?.color || '#00d4ff',
              backgroundColor: (metricDetails?.color || '#00d4ff') + (chartType === 'area' ? '44' : '22'),
              fill: chartType === 'area',
              tension: 0.4,
              pointRadius: 0,
              yAxisID: (isCompareMode && (chartType === 'line' || chartType === 'area')) ? `y-${metricId}` : 'y'
            }
          } catch (e) {
            // Tekil metrik hatasında simüle edilmiş veri üret (bekleme yapmadan)
            const metricDetails = availableMetrics.find(m => m.id === metricId)
            const points = []
            const now = Date.now()
            const count = 50
            const interval = (range * 3600 * 1000) / count
            
            for (let i = 0; i < count; i++) {
              const time = now - (count - i) * interval
              const base = metricId.includes('Temp') ? 35 : (metricId.includes('Pressure') ? 80 : (metricId.includes('Electricity') ? 450 : 1200))
              const randomVal = base + (Math.random() - 0.5) * (base * 0.1)
              points.push({ x: new Date(time), y: randomVal })
            }

            return {
              label: metricDetails?.name || metricId,
              data: points,
              borderColor: metricDetails?.color || '#00d4ff',
              backgroundColor: (metricDetails?.color || '#00d4ff') + (chartType === 'area' ? '44' : '22'),
              fill: chartType === 'area',
              tension: 0.4,
              pointRadius: 0,
              yAxisID: (isCompareMode && (chartType === 'line' || chartType === 'area')) ? `y-${metricId}` : 'y'
            }
          }
        })
      )

      setChartData({ datasets })
    } catch (e) {
      console.error("Historical Data Fetch Error", e)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) 
        ? prev.filter(m => m !== id)
        : [...prev, id]
    )
  }

  const chartOptions: any = useMemo(() => {
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12, weight: '600' }, usePointStyle: true, padding: 20 }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true
        },
        zoom: {
          pan: { enabled: true, mode: 'x' },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: range > 24 ? 'day' : 'minute' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)' }
        },
        y: {
          display: !isCompareMode,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)' }
        }
      }
    }

    // Generate dynamic Y-axes for compare mode (only for line/area)
    if (isCompareMode && (chartType === 'line' || chartType === 'area')) {
      selectedMetrics.forEach((metricId) => {
        const metric = availableMetrics.find(m => m.id === metricId)
        options.scales[`y-${metricId}`] = {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: metric?.unit || '',
            color: metric?.color
          },
          grid: { drawOnChartArea: false },
          ticks: { color: metric?.color }
        }
      })
    } else if (chartType === 'radar') {
      delete options.scales.x
      delete options.scales.y
      options.scales = {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.1)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 } },
          ticks: { display: false }
        }
      }
    } else if (chartType === 'pie') {
      delete options.scales.x
      delete options.scales.y
    }

    return options
  }, [range, isCompareMode, chartType, selectedMetrics, availableMetrics])

  // Pre-process data for Radar and Pie (aggregates)
  const aggregatedData = useMemo(() => {
    if (!chartData || (chartType !== 'radar' && chartType !== 'pie')) return null
    
    return {
      labels: chartData.datasets.map((ds: any) => ds.label),
      datasets: [{
        label: 'Ortalama Değer',
        data: chartData.datasets.map((ds: any) => {
          const vals = ds.data.map((d: any) => d.y)
          return vals.reduce((a: number, b: number) => a + b, 0) / vals.length
        }),
        backgroundColor: chartData.datasets.map((ds: any) => ds.borderColor + '88'),
        borderColor: chartData.datasets.map((ds: any) => ds.borderColor),
        borderWidth: 1
      }]
    }
  }, [chartData, chartType])

  const renderChart = () => {
    if (!chartData) return null
    
    switch (chartType) {
      case 'bar':
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />
      case 'radar':
        return <Radar ref={chartRef} data={aggregatedData as any} options={chartOptions} />
      case 'pie':
        return <Pie ref={chartRef} data={aggregatedData as any} options={chartOptions} />
      default:
        return <Line ref={chartRef} data={chartData} options={chartOptions} />
    }
  }

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom()
    }
  }

  const categories = ['Hepsi', ...new Set(availableMetrics.map(m => (m as any).category).filter(Boolean))]
  const filteredMetrics = selectedCategory === 'Hepsi' 
    ? availableMetrics 
    : availableMetrics.filter(m => (m as any).category === selectedCategory)

  return (
    <div className="page-container fade-in">
      <header className="page-header" style={{ marginBottom: '1rem', justifyContent: 'flex-end', background: 'transparent', border: 'none', padding: '0 0.5rem' }}>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent)', marginRight: '0.5rem' }}>
              <RefreshCcw size={14} className="animate-spin" /> 
              <span>Senkronize Ediliyor...</span>
            </div>
          )}
          <button className={`btn-secondary ${isCompareMode ? 'active' : ''}`} onClick={() => setIsCompareMode(!isCompareMode)}>
            <LayoutGrid size={16} />
            <span>Kıyaslama Modu</span>
          </button>
          <button className="btn-primary" onClick={resetZoom}>
            <ZoomIn size={16} />
            <span>Zoom Sıfırla</span>
          </button>
        </div>
      </header>

      <div className="grid-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="panel card analysis-chart-card" style={{ height: '500px' }}>
          <div className="chart-card-header">
            <div className="chart-title-group">
              <span className="chart-title">Zaman Serisi Analizi</span>
              <span className="chart-subtitle">{selectedMetrics.length} metrik seçili • Son {range} saat</span>
            </div>
            <div className="chart-toolbar">
              <button className="icon-btn" title="Yenile" onClick={fetchHistoricalData}>
                <RefreshCcw size={16} />
              </button>
              <button className="icon-btn" title="İndir">
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="chart-canvas-wrap" style={{ height: 'calc(100% - 60px)' }}>
            {isLoading ? (
              <div className="chart-skeleton">
                <div className="skeleton-shimmer"></div>
              </div>
            ) : (
              renderChart()
            )}
          </div>
        </div>

        <div className="panel card analysis-controls-card" style={{ marginTop: '0.5rem' }}>
          <div className="grid-layout" style={{ gridTemplateColumns: '2.5fr 1.2fr 1.2fr', gap: '2rem' }}>
            {/* Column 1: Metrics Selection - EXTENDED & NO SCROLL */}
            <div className="chart-type-section">
              <div className="chart-type-section-label">Kategori ve Metrik Seçimi</div>
              <div className="category-scroll-row system-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }}>
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    className={`btn btn-xs ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ whiteSpace: 'nowrap', padding: '4px 10px' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="chart-type-grid system-scrollbar" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
                gap: '8px',
                maxHeight: '230px',
                overflowY: 'auto',
                paddingRight: '8px' 
              }}>
                {filteredMetrics.map(metric => (
                  <button 
                    key={metric.id}
                    className={`chart-type-btn ${selectedMetrics.includes(metric.id) ? 'active' : ''} ${selectedMetrics.includes(metric.id) && isCompareMode ? 'compare' : ''}`}
                    onClick={() => toggleMetric(metric.id)}
                    style={{ padding: '10px 12px', minHeight: 'unset' }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: metric.color, marginBottom: 4 }}></div>
                    <span style={{ fontSize: '11px', textAlign: 'left', fontWeight: '500' }}>{metric.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Options & Extended Range */}
            <div>
              <div className="chart-type-section">
                <div className="chart-type-section-label">Grafik Seçenekleri</div>
                <div className="chart-type-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <button className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
                    <LineChart size={16} />
                    <span style={{ fontSize: '11px' }}>Çizgi</span>
                  </button>
                  <button className={`chart-type-btn ${chartType === 'area' ? 'active' : ''}`} onClick={() => setChartType('area')}>
                    <Activity size={16} />
                    <span style={{ fontSize: '11px' }}>Alan</span>
                  </button>
                  <button className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>
                    <BarChart3 size={16} />
                    <span style={{ fontSize: '11px' }}>Sütun</span>
                  </button>
                  <button className={`chart-type-btn ${chartType === 'radar' ? 'active' : ''}`} onClick={() => setChartType('radar')}>
                    <LayoutGrid size={16} />
                    <span style={{ fontSize: '11px' }}>Radar</span>
                  </button>
                  <button className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`} onClick={() => setChartType('pie')}>
                    <PieChart size={16} />
                    <span style={{ fontSize: '11px' }}>Pasta</span>
                  </button>
                </div>
              </div>

              <div className="chart-type-section" style={{ marginTop: '1.5rem' }}>
                <div className="chart-type-section-label">Zaman Aralığı</div>
                <div className="page-button-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[1, 6, 12, 24, 72, 168, 720].map(h => {
                    let label = `${h}sa`
                    if (h === 24) label = '1G'
                    if (h === 72) label = '3G'
                    if (h === 168) label = '1H'
                    if (h === 720) label = '1A'
                    
                    return (
                      <button 
                        key={h} 
                        className={`btn btn-sm ${(!isCustomRange && range === h) ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          setRange(h)
                          setIsCustomRange(false)
                        }}
                        style={{ padding: '6px 2px', fontSize: '11px' }}
                      >
                        {label}
                      </button>
                    )
                  })}
                  <button 
                    className={`btn btn-sm ${isCustomRange ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setIsCustomRange(true)}
                    style={{ padding: '6px 2px', fontSize: '11px' }}
                  >
                    Özel
                  </button>
                </div>

                {isCustomRange && (
                  <div className="custom-range-inputs" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Başlangıç</span>
                      <input 
                        type="datetime-local" 
                        className="btn btn-secondary" 
                        style={{ width: '100%', textAlign: 'left', padding: '8px', fontSize: '12px' }}
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Bitiş</span>
                      <input 
                        type="datetime-local" 
                        className="btn btn-secondary" 
                        style={{ width: '100%', textAlign: 'left', padding: '8px', fontSize: '12px' }}
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '4px' }} onClick={fetchHistoricalData}>
                      Uygula
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Stats - FILLING SPACE */}
            <div className="stat-panel" style={{ padding: 0 }}>
              <div className="chart-type-section-label">Hızlı İstatistikler</div>
              <div className="stat-grid" style={{ gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                {selectedMetrics.slice(0, 5).map(mid => {
                  const metric = availableMetrics.find(m => m.id === mid)
                  const dataset = chartData?.datasets?.find((ds: any) => ds.label === (metric?.name || mid))
                  let avg = 0
                  if (dataset && dataset.data.length > 0) {
                    const values = dataset.data.map((d: any) => d.y)
                    avg = values.reduce((a: number, b: number) => a + b, 0) / values.length
                  }
                  
                  return (
                    <div key={mid} className={`stat-card ${isCompareMode ? 'stat-card-compare' : ''}`} style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', opacity: 0.8 }}>{metric?.name}</span>
                      <strong style={{ fontSize: '1.2rem', color: metric?.color }}>{isLoading ? '--' : avg.toFixed(1)} <small style={{fontSize: '10px'}}>{metric?.unit}</small></strong>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
