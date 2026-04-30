import React, { useState, useEffect } from 'react'
import { Radar, ShieldAlert, Activity, Wifi, Settings, RefreshCw, Zap, Box, Layers, Database, Cpu, Map as MapIcon, Maximize2 } from 'lucide-react'

const RadarView: React.FC = () => {
  const [status, setStatus] = useState('Standby') // Standby, Calibration, Monitoring, Mapping, Alert
  const [immobilTime, setImmobilTime] = useState(0)
  const [csiData, setCsiData] = useState<number[]>([])
  const [meshData, setMeshData] = useState({ x: 50, y: 50, posture: 'Standing', confidence: 0.98 })
  
  // Dynamic Mapping State
  const [detectedWalls, setDetectedWalls] = useState<{x: number, y: number, w: number, h: number}[]>([])
  const [mappingProgress, setMappingProgress] = useState(0)

  // InvisPose Signal Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCsiData(prev => {
        const baseNoise = Math.random() * 20
        const signalMod = status === 'Monitoring' || status === 'Mapping' ? Math.sin(Date.now() / 500) * 15 : 0
        const next = [...prev, 40 + baseNoise + signalMod].slice(-40)
        return next
      })
    }, 80)
    return () => clearInterval(interval)
  }, [status])

  // Dynamic Mapping Mode Logic (Randomized Discovery)
  useEffect(() => {
    let interval: any
    if (status === 'Mapping' && mappingProgress < 100) {
      interval = setInterval(() => {
        setMappingProgress(prev => {
          const next = prev + 4
          
          // Rastgele girinti ve duvar segmentleri oluştur
          if (next % 12 === 0) {
            const isHorizontal = Math.random() > 0.5
            const newWall = {
              x: 10 + Math.random() * 70,
              y: 10 + Math.random() * 70,
              w: isHorizontal ? 10 + Math.random() * 40 : 2 + Math.random() * 3,
              h: isHorizontal ? 2 + Math.random() * 3 : 10 + Math.random() * 40
            }
            setDetectedWalls(prevWalls => [...prevWalls, newWall])
          }

          if (next >= 100) setStatus('Monitoring')
          return next
        })
      }, 300)
    }
    return () => clearInterval(interval)
  }, [status, mappingProgress])

  return (
    <div className="radar-view fade-in" style={{ padding: '1.5rem', color: 'white', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', height: 'calc(100vh - 120px)', background: '#05070a' }}>
      <style>{`
        .invis-grid {
          background-image: radial-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
          background: #080a0f;
        }
        .wall-segment {
          position: absolute;
          background: var(--accent);
          opacity: 0.4;
          box-shadow: 0 0 15px var(--accent);
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border-radius: 2px;
        }
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .skeleton-part {
          stroke: var(--accent);
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
          filter: drop-shadow(0 0 8px var(--accent));
        }
        .signal-hop {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          opacity: 0.8;
          filter: blur(1px);
          animation: hop 0.5s ease-out;
        }
        @keyframes hop {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(10); opacity: 0; }
        }
      `}</style>

      {/* 🧬 InvisPose 3D Reconstruction & Mapping Area */}
      <div className="invis-grid">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'linear-gradient(rgba(0,212,255,0.05) 0%, transparent 10%, transparent 90%, rgba(0,212,255,0.05) 100%)' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50px', background: 'linear-gradient(rgba(0,212,255,0.1), transparent)', animation: 'scan-line 4s linear infinite', zIndex: 2 }}></div>

        {/* Dynamic Wall Segments */}
        {detectedWalls.map((wall, i) => (
          <div key={i} className="wall-segment" style={{ left: `${wall.x}%`, top: `${wall.y}%`, width: `${wall.w}%`, height: `${wall.h}%` }}></div>
        ))}

        {/* Labels & Metadata */}
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 5 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '2px' }}>WIFI-SLAM DYNAMIC DISCOVERY</div>
          <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>SIGNAL_PATH: CSI_HOP_MATRIX_{mappingProgress > 0 ? mappingProgress : 'IDLE'}</div>
        </div>

        {/* Real-time Skeleton */}
        {(status === 'Monitoring' || status === 'Alert') && (
          <div style={{ position: 'absolute', top: `${meshData.y}%`, left: `${meshData.x}%`, transform: 'translate(-50%, -50%)', transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
               <g className="skeleton-part">
                  <circle cx="50" cy="15" r="7" />
                  <line x1="50" y1="22" x2="50" y2="55" />
                  <line x1="50" y1="30" x2="30" y2="45" />
                  <line x1="50" y1="30" x2="70" y2="45" />
                  <line x1="50" y1="55" x2="40" y2="85" />
                  <line x1="50" y1="55" x2="60" y2="85" />
               </g>
            </svg>
          </div>
        )}

        {status === 'Mapping' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.5rem', letterSpacing: '2px' }}>KEŞFEDİLİYOR... %{mappingProgress}</div>
            <div style={{ width: '200px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
              <div style={{ width: `${mappingProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', opacity: 0.4 }}>MIMO Antenna Array Discovery Mode</div>
          </div>
        )}
      </div>

      {/* 📡 Environmental Telemetry Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={16} /> ASİMETRİK SLAM ANALİZİ
          </h3>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Tespit Edilen Segment</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{detectedWalls.length} Unsur</div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Yansıma Gücü (Path Loss)</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{(Math.random() * -10 - 40).toFixed(1)} dBm</div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button onClick={() => { setStatus('Mapping'); setDetectedWalls([]); setMappingProgress(0); }} className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              YENİDEN TARA (KEŞFET)
            </button>
            
            <button onClick={() => { setStatus('Standby'); setDetectedWalls([]); setMappingProgress(0); }} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>
              VERİLERİ SIFIRLA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
