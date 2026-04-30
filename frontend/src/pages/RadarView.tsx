import React, { useState, useEffect } from 'react'
import { Radar, ShieldAlert, Activity, Wifi, Settings, RefreshCw, Zap, Box, Layers, Database, Cpu, Search } from 'lucide-react'

const RadarView: React.FC = () => {
  const [status, setStatus] = useState('Standby') // Standby, Calibration, Monitoring, Alert
  const [immobilTime, setImmobilTime] = useState(0)
  const [csiData, setCsiData] = useState<number[]>([])
  const [meshData, setMeshData] = useState({ x: 50, y: 50, posture: 'Standing', confidence: 0.98 })

  // InvisPose Signal Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCsiData(prev => {
        const baseNoise = Math.random() * 20
        const signalMod = status === 'Monitoring' ? Math.sin(Date.now() / 500) * 15 : 0
        const next = [...prev, 40 + baseNoise + signalMod].slice(-40)
        return next
      })
    }, 80)
    return () => clearInterval(interval)
  }, [status])

  // Immobility Detection Logic
  useEffect(() => {
    let interval: any
    if (status === 'Monitoring') {
      interval = setInterval(() => {
        setImmobilTime(prev => {
          const next = prev + 1
          if (next > 15) setMeshData(m => ({ ...m, posture: 'Lying Down', y: 80, x: 40 }))
          if (next >= 300) setStatus('Alert') // 5 mins
          return next
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [status])

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
        }
        .csi-stream {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 100%;
        }
        .csi-bar {
          flex: 1;
          background: var(--accent);
          opacity: 0.4;
          transition: height 0.1s ease;
        }
        .pipeline-step {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          font-size: 0.8rem;
          transition: all 0.3s;
        }
        .pipeline-step.active {
          background: rgba(0, 212, 255, 0.05);
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
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
        .alert-pulse {
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(255, 77, 77, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
        }
      `}</style>

      {/* 🧬 InvisPose 3D Reconstruction Area */}
      <div className="invis-grid">
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'linear-gradient(rgba(0,212,255,0.05) 0%, transparent 10%, transparent 90%, rgba(0,212,255,0.05) 100%)' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50px', background: 'linear-gradient(rgba(0,212,255,0.1), transparent)', animation: 'scan-line 4s linear infinite', zIndex: 2 }}></div>

        {/* Labels & Metadata */}
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 5 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '2px' }}>WIFI-DENSEPOSE MONITOR</div>
          <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>DEVICE: MESH_NODE_7_CSI | FREQ: 5.8GHz</div>
        </div>

        {/* Real-time Skeleton (InvisPose Model Output) */}
        {(status === 'Monitoring' || status === 'Alert') && (
          <div style={{ position: 'absolute', top: `${meshData.y}%`, left: `${meshData.x}%`, transform: 'translate(-50%, -50%)', transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <svg width="200" height="200" viewBox="0 0 100 100">
              {meshData.posture === 'Standing' ? (
                <g className="skeleton-part">
                  <circle cx="50" cy="15" r="7" />
                  <line x1="50" y1="22" x2="50" y2="55" />
                  <line x1="50" y1="30" x2="30" y2="45" />
                  <line x1="50" y1="30" x2="70" y2="45" />
                  <line x1="50" y1="55" x2="40" y2="85" />
                  <line x1="50" y1="55" x2="60" y2="85" />
                </g>
              ) : (
                <g className="skeleton-part" style={{ stroke: status === 'Alert' ? '#ff4d4d' : 'var(--accent)' }}>
                  <circle cx="20" cy="80" r="7" />
                  <line x1="27" y1="80" x2="65" y2="80" />
                  <line x1="35" y1="80" x2="35" y2="65" />
                  <line x1="50" y1="80" x2="50" y2="65" />
                  <line x1="65" y1="80" x2="90" y2="75" />
                  <line x1="65" y1="80" x2="90" y2="85" />
                </g>
              )}
            </svg>
            <div style={{ textAlign: 'center', marginTop: '-1rem', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 1rem', borderRadius: '20px', fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              POSE: <span style={{ color: status === 'Alert' ? '#ff4d4d' : 'var(--accent)', fontWeight: 'bold' }}>{meshData.posture.toUpperCase()}</span>
            </div>
          </div>
        )}

        {status === 'Alert' && (
          <div className="alert-pulse" style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: '#7a0000', border: '1px solid #ff4d4d', padding: '1rem 2.5rem', borderRadius: '16px', zIndex: 10, textAlign: 'center' }}>
            <ShieldAlert size={32} color="#ff4d4d" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>CRITICAL IMMOBILITY</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Oda 102 - 5 Dakika+ Hareketsizlik Tespit Edildi</div>
          </div>
        )}
      </div>

      {/* 📡 Data Pipeline & Telemetry Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', opacity: 0.5, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={16} /> DATA PIPELINE (WiFi-DensePose)
          </h3>

          <div className={`pipeline-step ${status !== 'Standby' ? 'active' : ''}`}>
            <Wifi size={18} color="var(--accent)" />
            <div>
              <strong>CSI Data Collector</strong>
              <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Mesh Router Stream @ 30FPS</div>
            </div>
          </div>

          <div className={`pipeline-step ${status === 'Monitoring' || status === 'Alert' ? 'active' : ''}`}>
            <Zap size={18} color="var(--accent)" />
            <div>
              <strong>Phase Sanitization</strong>
              <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Noise Filtering & Signal Normalization</div>
            </div>
          </div>

          <div className={`pipeline-step ${status === 'Monitoring' || status === 'Alert' ? 'active' : ''}`}>
            <Cpu size={18} color="var(--accent)" />
            <div>
              <strong>Neural Pose Engine</strong>
              <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>ResNet-DensePose Mesh Generation</div>
            </div>
          </div>

          <div style={{ height: '80px', marginTop: '1rem' }}>
             <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.5rem' }}>Raw CSI Signal Waveform</div>
             <div className="csi-stream">
               {csiData.map((v, i) => (
                 <div key={i} className="csi-bar" style={{ height: `${v}%`, opacity: status === 'Alert' ? 0.8 : 0.4, background: status === 'Alert' ? '#ff4d4d' : 'var(--accent)' }}></div>
               ))}
             </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {status === 'Standby' ? (
              <button onClick={() => setStatus('Monitoring')} className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                İNCELEMEYİ BAŞLAT
              </button>
            ) : (
              <button onClick={() => { setStatus('Standby'); setImmobilTime(0); setMeshData({x:50,y:50,posture:'Standing',confidence:0.98}); }} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>
                SİSTEMİ RESETLE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
