import React, { useState, useEffect } from 'react'
import { Radar, ShieldAlert, Activity, Wifi, Settings, RefreshCw, Zap, Box, Layers, Map as MapIcon, Compass } from 'lucide-react'

const RadarView: React.FC = () => {
  const [status, setStatus] = useState('Standby') // Standby, Monitoring, Mapping, Alert
  const [immobilTime, setImmobilTime] = useState(0)
  const [csiData, setCsiData] = useState<number[]>([])
  const [meshData, setMeshData] = useState({ x: 50, y: 50, posture: 'Standing' })
  
  // Architectural Mapping State (Connected Points)
  const [mapPoints, setMapPoints] = useState<{x: number, y: number}[]>([])
  const [mappingProgress, setMappingProgress] = useState(0)

  // InvisPose Signal Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCsiData(prev => {
        const next = [...prev, 30 + Math.random() * 40].slice(-40)
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Architectural SLAM Logic
  useEffect(() => {
    let interval: any
    if (status === 'Mapping' && mappingProgress < 100) {
      interval = setInterval(() => {
        setMappingProgress(prev => {
          const next = prev + 5
          
          // Mimari hat oluştur (Bağlı noktalar)
          const points = [
            { x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 40 }, 
            { x: 90, y: 40 }, { x: 90, y: 80 }, { x: 20, y: 80 }, { x: 20, y: 20 }
          ]
          
          const pointIndex = Math.floor((next / 100) * points.length)
          setMapPoints(points.slice(0, pointIndex + 1))

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
        .floor-plan-container {
          background: #0a0d14;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .grid-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.5;
        }
        .wall-line {
          fill: rgba(0, 212, 255, 0.05);
          stroke: var(--accent);
          stroke-width: 3;
          stroke-linejoin: round;
          stroke-linecap: round;
          filter: drop-shadow(0 0 10px var(--accent));
          transition: all 0.5s ease;
        }
        @keyframes radar-pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        .person-marker {
          transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* 📐 Architectural Floor Plan Area */}
      <div className="floor-plan-container">
        <div className="grid-layer"></div>
        
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Odanın Poligon Hattı */}
          {mapPoints.length > 1 && (
            <polyline 
              points={mapPoints.map(p => `${p.x},${p.y}`).join(' ')} 
              className="wall-line"
            />
          )}

          {/* İnsan Pozisyonu */}
          {(status === 'Monitoring' || status === 'Alert') && (
            <g className="person-marker" transform={`translate(${meshData.x}, ${meshData.y})`}>
              <circle r="3" fill="var(--accent)" />
              <circle r="8" fill="none" stroke="var(--accent)" strokeWidth="0.5">
                <animate attributeName="r" from="3" to="15" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
              {/* Basit İskelet */}
              <g stroke="var(--accent)" strokeWidth="1" opacity="0.8">
                <circle cx="0" cy="-5" r="1.5" fill="none" />
                <line x1="0" y1="-3.5" x2="0" y2="2" />
                <line x1="-3" y1="0" x2="3" y2="0" />
                <line x1="0" y1="2" x2="-2" y2="6" />
                <line x1="0" y1="2" x2="2" y2="6" />
              </g>
            </g>
          )}
        </svg>

        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Compass className="spin" size={20} color="var(--accent)" />
          <div style={{ letterSpacing: '2px', fontSize: '0.8rem', fontWeight: 'bold' }}>WIFI-SLAM ARCHITECTURAL MAP</div>
        </div>

        {status === 'Mapping' && (
          <div style={{ position: 'absolute', bottom: '2rem', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>ODA PLANI ÇIKARILIYOR... %{mappingProgress}</div>
            <div style={{ width: '300px', height: '2px', background: 'rgba(255,255,255,0.05)', margin: '0 auto', overflow: 'hidden' }}>
              <div style={{ width: `${mappingProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* 📡 Telemetry & Logic Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <h3 style={{ fontSize: '0.9rem', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={16} /> KAT PLANI VERİLERİ
          </h3>

          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.3rem' }}>Oda Alanı (Tahmini)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>24.5 m²</div>
          </div>

          <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.3rem' }}>Sinyal Gücü (CSI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>-52 dBm</div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => { setStatus('Mapping'); setMapPoints([]); setMappingProgress(0); }} className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              KAT PLANINI ÇIKAR
            </button>
            <button onClick={() => { setStatus('Standby'); setMapPoints([]); setMappingProgress(0); }} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>
              HARİTAYI TEMİZLE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
