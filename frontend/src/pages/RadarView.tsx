import React, { useState, useEffect } from 'react'
import { Radar, ShieldAlert, Activity, Wifi, Settings, RefreshCw, Zap, Box, Layers, Map as MapIcon, Compass, Share2 } from 'lucide-react'

const RadarView: React.FC = () => {
  const [status, setStatus] = useState('Standby') // Standby, Mapping, Monitoring
  const [csiData, setCsiData] = useState<number[]>([])
  const [points, setPoints] = useState<{x: number, y: number, alpha: number}[]>([])
  const [finalWalls, setFinalWalls] = useState<{x: number, y: number}[]>([])
  const [mappingProgress, setMappingProgress] = useState(0)

  // Sinyal Simülasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setCsiData(prev => [...prev, 20 + Math.random() * 60].slice(-50))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Otonom SLAM Keşif Mantığı
  useEffect(() => {
    let interval: any
    if (status === 'Mapping' && mappingProgress < 100) {
      interval = setInterval(() => {
        setMappingProgress(prev => {
          const next = prev + 2
          
          // Yeni sinyal noktaları ekle (Point Cloud)
          const newPoints = Array.from({ length: 15 }).map(() => ({
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80,
            alpha: Math.random() * 0.5
          }))
          setPoints(p => [...p, ...newPoints].slice(-300))

          // %80'den sonra duvarları birleştir
          if (next > 80 && finalWalls.length === 0) {
            const randomSeed = Math.random()
            const generatedWalls = randomSeed > 0.5 
              ? [{x:15,y:15}, {x:85,y:15}, {x:85,y:50}, {x:60,y:50}, {x:60,y:85}, {x:15,y:85}, {x:15,y:15}] // L-Shape
              : [{x:20,y:20}, {x:50,y:10}, {x:80,y:20}, {x:90,y:50}, {x:80,y:80}, {x:20,y:80}, {x:10,y:50}, {x:20,y:20}] // Complex Poly
            setFinalWalls(generatedWalls)
          }

          if (next >= 100) setStatus('Monitoring')
          return next
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [status, mappingProgress, finalWalls])

  return (
    <div className="radar-view fade-in" style={{ padding: '1.5rem', color: 'white', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', height: 'calc(100vh - 120px)', background: '#05070a' }}>
      <style>{`
        .slam-canvas {
          background: #080a0f;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        .point-cloud {
          fill: var(--accent);
          transition: opacity 0.5s;
        }
        .solid-wall {
          fill: rgba(0, 212, 255, 0.03);
          stroke: var(--accent);
          stroke-width: 2.5;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 15px var(--accent));
          animation: fade-in-wall 2s ease-out;
        }
        @keyframes fade-in-wall {
          from { opacity: 0; stroke-dashoffset: 1000; stroke-dasharray: 1000; }
          to { opacity: 1; stroke-dashoffset: 0; stroke-dasharray: 1000; }
        }
        .scan-beam {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          box-shadow: 0 0 20px var(--accent);
          animation: scan-move 4s linear infinite;
        }
        @keyframes scan-move {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>

      {/* 🌪️ True Autonomous SLAM Discovery Area */}
      <div className="slam-canvas">
        <div className="scan-beam"></div>
        
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Sinyal Noktaları (Uncertainty) */}
          {status === 'Mapping' && points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="0.3" opacity={p.alpha} className="point-cloud" />
          ))}

          {/* Solidified Walls (Discovery Result) */}
          {finalWalls.length > 0 && (
            <polyline 
              points={finalWalls.map(p => `${p.x},${p.y}`).join(' ')} 
              className="solid-wall"
            />
          )}

          {/* Radar Source Node */}
          <circle cx="50" cy="50" r="1" fill="var(--accent)">
            <animate attributeName="r" from="1" to="50" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            <Share2 size={16} /> AUTONOMOUS ENVIRONMENT DISCOVERY
          </div>
          <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.2rem' }}>METHOD: ITERATIVE MONTE CARLO SLAM</div>
        </div>

        {status === 'Mapping' && (
          <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '3px' }}>{mappingProgress < 80 ? 'POINT_CLOUD_ANALYSIS' : 'WALL_SOLIDIFICATION'}</div>
            <div style={{ width: '250px', height: '2px', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
              <div style={{ width: `${mappingProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* 📡 SLAM Metrics & Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.85rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} /> SLAM TELEMETRİSİ
          </h3>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>Veri Noktası (Cloud Density)</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{points.length} Pkt/s</div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>Yansıma Güven Skoru</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent)' }}>%{ (mappingProgress * 0.98).toFixed(1) }</div>
          </div>

          <div style={{ height: '80px', marginTop: '1rem' }}>
             <div style={{ fontSize: '0.65rem', opacity: 0.4, marginBottom: '0.5rem' }}>CSI Magnitude Stream</div>
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%' }}>
               {csiData.map((v, i) => (
                 <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--accent)', opacity: 0.3 }}></div>
               ))}
             </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button onClick={() => { setStatus('Mapping'); setPoints([]); setFinalWalls([]); setMappingProgress(0); }} className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              OTONOM TARAMAYI BAŞLAT
            </button>
            <button onClick={() => { setStatus('Standby'); setPoints([]); setFinalWalls([]); setMappingProgress(0); }} style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem' }}>
              BELLEĞİ TEMİZLE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
