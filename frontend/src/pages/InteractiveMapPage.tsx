import { useState, useEffect, useRef, useCallback } from 'react';
import { Users, AlertTriangle, Activity, TrendingUp, TrendingDown, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { API_BASE } from '../config';

interface ZoneData {
  id: string;
  name: string;
  x_pct: number;
  y_pct: number;
  personnel: string[];
  emergencies: string[];
  profit_loss: number;
  is_bypassed: boolean;
  is_downtime: boolean;
}


// Kullanıcı tarafından elle ayarlanmış kesin parsel koordinatları
const PARCELS: string[] = [
  "28.7,56.6 30.8,57.3 31.1,63.5 33.4,63.1 34.8,60.9 33.7,54.9 40.4,51.1 39.6,79.5 40.4,83.8 30,83.5 26,83.5 24,81.5 24,77.5 24,73.5 24.1,67.4 25.2,59.1",
  "40,55 42.6,51.4 44.1,59.3 48.6,56.1 51.3,56 51.5,67.9 51.5,74 51.6,79.8 52.9,82.8 49.1,85 41.5,85.2 40,79.7 40,74.8 40,69.8 40,64.9 40,59.9",
  "51,51 63.7,51.2 64.7,49.4 67,52.7 76.4,70.6 73.2,75.6 68.1,68.7 64.2,75.8 62.3,79.7 60.3,82.8 54.1,83.5 52,79.7 52,73.8 52,67.8 52,61.9 51,56.9",
  "50,33.5 52.8,30.9 54.3,35 54.3,37.4 54,41.8 54.4,50.4 52,50.6 51,54 47.6,55 47.9,53.8 47.4,52.1 46.8,49.2 46.2,46.9 46,43.3 46,38.9 47.6,35.6",
  "77.9,72.5 78.5,73.2 82.5,76.4 83.8,78.6 87.9,71.4 92.5,77.6 96.8,99.9 69,99.5 76.3,82.8 76.2,82.7 75.4,80.3 74.1,77.1 73.9,77.3 73.5,76.9 76.1,70.5 81.3,78.6",
  "74.3,32.9 77.7,37.8 80.2,30 91.5,24 93,28.7 93,34.9 91,42.4 88.4,49 87.6,56.2 85.8,69.5 82.7,74.7 80.6,75 77.4,71.7 58.3,36.8 62.9,26.8 71,40.4",
  "59.6,18.7 70.4,0.5 95.4,0.7 99.8,0.5 100,11.5 100,17.4 100,23.2 100,29.1 99.8,36.7 92.1,39.8 93,30.2 93,24.4 87.9,26.1 77.1,33.6 74.3,31.3 68.5,24.2"
];

const COLORS: string[] = [
  "rgba(188, 231, 248, 1)", "rgba(255, 0, 234, 1)", "rgba(221, 160, 221, 1)",
  "rgba(255, 255, 255, 1)", "rgba(0, 4, 255, 1)", "rgba(251, 255, 7, 1)", "rgba(143, 188, 143, 1)"
];

export default function InteractiveMapPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const clampPan = useCallback((x: number, y: number, z: number) => {
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return { x, y };
    const maxX = (wrapper.clientWidth  * (z - 1)) / 2;
    const maxY = (wrapper.clientHeight * (z - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  // Card drag
  const [cardPos, setCardPos] = useState({ x: -1, y: -1 });
  const isDraggingCard = useRef(false);
  const cardOffset = useRef({ ox: 0, oy: 0 });

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/home/map/zones`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setZones(data);
        if (data.length > 0 && !selectedZone) setSelectedZone(data[0]);
      } else {
        throw new Error('Invalid data');
      }
    } catch {
      // 🛡️ Fallback: API gelmezse haritayı boş bırakma
      const mockZones: ZoneData[] = [
        { id: 'z1', name: 'Zone-1 (Rafineri)', x_pct: 30, y_pct: 60, personnel: ['Ahmet Y.', 'Mehmet K.'], emergencies: [], profit_loss: 12500, is_bypassed: false, is_downtime: false },
        { id: 'z2', name: 'Zone-2 (Lojistik)', x_pct: 45, y_pct: 70, personnel: ['Ayşe T.', 'Fatma S.'], emergencies: ['Sensör Hatası'], profit_loss: -2300, is_bypassed: true, is_downtime: false },
        { id: 'z3', name: 'Zone-3 (Depolama)', x_pct: 60, y_pct: 65, personnel: ['Can B.', 'Ece V.'], emergencies: [], profit_loss: 4500, is_bypassed: false, is_downtime: true },
        { id: 'z4', name: 'Zone-4 (İskele)', x_pct: 50, y_pct: 40, personnel: ['Oğuz H.'], emergencies: [], profit_loss: 8900, is_bypassed: false, is_downtime: false },
        { id: 'z5', name: 'Zone-5 (Atık)', x_pct: 80, y_pct: 85, personnel: ['Selin D.'], emergencies: [], profit_loss: -1200, is_bypassed: false, is_downtime: false },
        { id: 'z6', name: 'Zone-6 (Enerji)', x_pct: 85, y_pct: 45, personnel: ['Murat G.'], emergencies: [], profit_loss: 15600, is_bypassed: false, is_downtime: false },
        { id: 'z7', name: 'Zone-7 (İdari)', x_pct: 80, y_pct: 15, personnel: ['Zeynep L.'], emergencies: [], profit_loss: 0, is_bypassed: false, is_downtime: false },
      ];
      setZones(mockZones);
      if (!selectedZone) setSelectedZone(mockZones[0]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Zoom ──────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => {
      const newZ = Math.min(4, Math.max(1, z + (e.deltaY > 0 ? -0.1 : 0.1)));
      setPan(p => clampPan(p.x, p.y, newZ));
      return newZ;
    });
  }, [clampPan]);

  // ─── Pan ───────────────────────────────────────────────────────────────────
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.zone-details-card')) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const rawX = e.clientX - panStart.current.x;
      const rawY = e.clientY - panStart.current.y;
      const clamped = clampPan(rawX, rawY, zoom);
      setPan(clamped);
    }
  };
  const handleMapMouseUp = () => { isPanning.current = false; };

  // ─── Card drag (Corrected for transforms/containers) ───────────────────────
  const handleCardMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const card = (e.currentTarget as HTMLElement).closest('.zone-details-card') as HTMLElement;
    const cardRect = card.getBoundingClientRect();
    
    cardOffset.current = { 
      ox: e.clientX - cardRect.left, 
      oy: e.clientY - cardRect.top 
    };
    
    isDraggingCard.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingCard.current) return;
      const x = ev.clientX - wrapperRect.left - cardOffset.current.ox;
      const y = ev.clientY - wrapperRect.top - cardOffset.current.oy;
      setCardPos({ x, y });
    };
    const onUp = () => {
      isDraggingCard.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const cardStyle: React.CSSProperties = cardPos.x === -1
    ? { position: 'absolute', top: '2rem', right: '2rem' }
    : { position: 'absolute', left: `${cardPos.x}px`, top: `${cardPos.y}px`, right: 'auto' };

  return (
    <div className="map-page-container fade-in-up">
      <div
        className="map-wrapper"
        ref={mapWrapperRef}
        onWheel={handleWheel}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab', overflow: 'hidden' }}
      >
        {/* Zoomable / pannable map */}
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning.current ? 'none' : 'transform 0.1s ease',
          position: 'absolute',
          inset: 0,
        }}>
          <img
            src="/Harita.jpg"
            alt="Saha Haritası"
            style={{ width: '100%', height: '100%', display: 'block', opacity: 0.9, objectFit: 'cover' }}
            draggable={false}
          />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}
          >
            {zones.map((zone, index) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <polygon
                  key={zone.id}
                  points={PARCELS[index] ?? PARCELS[0]}
                  style={{
                    fill: COLORS[index % COLORS.length],
                    fillOpacity: isSelected ? 0.62 : 0.32,
                    stroke: 'none',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    transition: 'fill-opacity 0.25s ease',
                  }}
                  className={`map-parcel ${zone.is_downtime ? 'downtime' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedZone(zone); }}
                  onMouseEnter={() => setSelectedZone(zone)}
                >
                  <title>{zone.name}</title>
                </polygon>
              );
            })}
          </svg>
        </div>

        {/* ── Zoom controls ──────────────────────────────────────────────────── */}
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 30 }}>
          <button onClick={() => {
            const newZ = Math.min(4, zoom + 0.25);
            setZoom(newZ);
            setPan(p => clampPan(p.x, p.y, newZ));
          }} style={zoomBtnStyle} title="Yakınlaş"><ZoomIn size={18} /></button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            style={{ ...zoomBtnStyle, minWidth: 52, fontSize: 11 }}
            title="Sıfırla"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => {
            const newZ = Math.max(1, zoom - 0.25);
            setZoom(newZ);
            setPan(p => clampPan(p.x, p.y, newZ));
          }} style={zoomBtnStyle} title="Uzaklaş"><ZoomOut size={18} /></button>
        </div>

        {/* ── Zone details card ──────────────────────────────────────────────── */}
        {selectedZone && (
          <div className="zone-details-card slide-in" style={{ ...cardStyle, cursor: 'default' }}>

            {/* Drag handle */}
            <div
              onMouseDown={handleCardMouseDown}
              style={{
                cursor: 'grab',
                paddingBottom: 10,
                marginBottom: 4,
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: 0 }}>{selectedZone.name}</h3>
                <div className="zone-status-badges">
                  {selectedZone.is_downtime
                    ? <span className="badge badge-danger">DURUŞ</span>
                    : <span className="badge badge-success">AKTİF</span>}
                  {selectedZone.is_bypassed && <span className="badge badge-warning">BYPASS</span>}
                </div>
              </div>
              <span style={{ opacity: 0.35, fontSize: 20, lineHeight: 1, marginTop: 2 }}>⠿</span>
            </div>

            <div className="zone-card-body">
              <div className="zone-metric">
                <div className="metric-header">
                  <Users size={16} />
                  <span>Personel ({selectedZone.personnel.length})</span>
                </div>
                <ul className="personnel-list">
                  {selectedZone.personnel.map(p => <li key={p}>{p}</li>)}
                </ul>
              </div>

              <div className="zone-metric">
                <div className="metric-header" style={{ color: 'var(--danger)' }}>
                  <AlertTriangle size={16} />
                  <span>Acil Durumlar / Uyarılar</span>
                </div>
                <ul className="emergency-list">
                  {selectedZone.emergencies.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>

              <div className="zone-metric">
                <div className="metric-header">
                  <Activity size={16} />
                  <span>Finansal Durum (Bölgesel)</span>
                </div>
                <div className={`financial-value ${selectedZone.profit_loss >= 0 ? 'profit' : 'loss'}`}>
                  {selectedZone.profit_loss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  <span>${Math.abs(selectedZone.profit_loss).toLocaleString()}</span>
                  <small>{selectedZone.profit_loss >= 0 ? ' Kar' : ' Zarar'}</small>
                </div>
              </div>
            </div>

            <button className="refresh-zone-btn" onClick={fetchZones} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              Verileri Güncelle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  background: 'var(--bg-glass)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  padding: '7px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  gap: 4,
  fontSize: 13,
  transition: 'background 0.2s',
};
