import React, { useState, useEffect } from 'react'
import { Radar, ShieldAlert, Activity, Wifi, Settings, RefreshCw, Zap, Box, Layers, Database, Cpu, Map as MapIcon, Maximize2 } from 'lucide-react'

const RadarView: React.FC = () => {
  const [status, setStatus] = useState('Standby') // Standby, Calibration, Monitoring, Mapping, Alert
  const [immobilTime, setImmobilTime] = useState(0)
  const [csiData, setCsiData] = useState<number[]>([])
  const [meshData, setMeshData] = useState({ x: 50, y: 50, posture: 'Standing', confidence: 0.98 })
  
  // Mapping State (WiFi SLAM)
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

  // Mapping Mode Logic
  useEffect(() => {
    let interval: any
    if (status === 'Mapping' && mappingProgress < 100) {
      interval = setInterval(() => {
        setMappingProgress(prev => {
          const next = prev + 5
          if (next === 20) setDetectedWalls(prev => [...prev, { x: 10, y: 10, w: 5, h: 80 }]) // Sol duvar
          if (next === 40) setDetectedWalls(prev => [...prev, { x: 10, y: 10, w: 80, h: 5 }]) // Üst duvar
          if (next === 60) setDetectedWalls(prev => [...prev, { x: 85, y: 10, w: 5, h: 80 }]) // Sağ duvar
          if (next === 80) setDetectedWalls(prev => [...prev, { x: 10, y: 85, w: 80, h: 5 }]) // Alt duvar
          if (next === 100) setStatus('Monitoring')
          return next
        })
      }, 500)
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
        .wall-detected {
          position: absolute;
          background: var(--accent);
          opacity: 0.4;
          box-shadow: 0 0 20px var(--accent);
          transition: all 0.5s ease-out;
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
      `}</style>

      {/* 🧬 InvisPose 3D Reconstruction & Mapping Area */}
      <div className="invis-grid">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'linear-gradient(rgba(0,212,255,0.05) 0%, transparent 10%, transparent 90%, rgba(0,212,255,0.05) 100%)' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50px', background: 'linear-gradient(rgba(0,212,255,0.1), transparent)', animation: 'scan-line 4s linear infinite', zIndex: 2 }}></div>

        {/* Detected Walls (WiFi Mapping) */}
        {detectedWalls.map((wall, i) => (
          <div key={i} className="wall-detected" style={{ left: `${wall.x}%`, top: `${wall.y}%`, width: `${wall.w}%`, height: `${wall.h}%` }}></div>
        ))}

        {/* Labels & Metadata */}
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 5 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '2px' }}>WIFI-SLAM & MAPPING</div>
          <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>MODE: {status === 'Mapping' ? 'ENVIRONMENTAL_PROFILING' : 'REALTIME_TRACKING'}</div>
        </div>

        {/* Real-time Skeleton */}
        {(status === 'Monitoring' || status === 'Alert') && (
          <div style={{ position: 'absolute', top: `${meshData.y}%`, left: `${meshData.x}%`, transform: 'translate(-50%, -50%)', transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <svg width="150" height="150" viewBox="0 0 100 100">
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
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.5rem' }}>HARİTALANDIRILIYOR...</div>
            <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{ width: `${mappingProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.5 }}>Multipath Reflection Analysis In Progress</div>
          </div>
        )}
      </div>

      {/* 📡 Environmental Telemetry Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', opacity: 0.5, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={16} /> ENV_TELEMETRY (SLAM)
          </h3>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Tespit Edilen Duvarlar</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{detectedWalls.length} Segment</div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Multipath Reflection SNR</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>-42.5 dBm</div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {status === 'Standby' && (
              <button onClick={() => setStatus('Mapping')} className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                ODAYI HARİTALANDIR (SLAM)
              </button>
            )}
            
            {(status === 'Monitoring' || status === 'Mapping') && (
              <button onClick={() => { setStatus('Standby'); setDetectedWalls([]); setMappingProgress(0); }} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>
                HARİTAYI SIFIRLA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
