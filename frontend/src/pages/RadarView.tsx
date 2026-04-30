import React, { useState, useEffect, useRef } from 'react'
import { Radar, ShieldAlert, Activity, Wifi, Settings, RefreshCw, AlertCircle, Zap, Box, UserCheck } from 'lucide-react'

const RadarView: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [status, setStatus] = useState('Standby') // Standby, Calibration, Monitoring, Alert
  const [immobilTime, setImmobilTime] = useState(0) // Seconds
  const [signalNoise, setSignalNoise] = useState<number[]>([])
  
  // DensePose Mock Data
  const [poseData, setPoseData] = useState({ x: 50, y: 50, posture: 'Standing' })

  const startCalibration = () => {
    setIsScanning(true)
    setScanProgress(0)
    setStatus('Calibration')
  }

  // Signal Noise Simulation (CSI Analysis)
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalNoise(prev => {
        const next = [...prev, Math.random() * 50 + 20].slice(-30)
        return next
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let interval: any
    if (isScanning && scanProgress < 100) {
      interval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 2, 100))
      }, 50)
    } else if (scanProgress === 100) {
      setIsScanning(false)
      setStatus('Monitoring')
    }
    return () => clearInterval(interval)
  }, [isScanning, scanProgress])

  // DensePose Simulation Logic
  useEffect(() => {
    let interval: any
    if (status === 'Monitoring') {
      interval = setInterval(() => {
        setImmobilTime(prev => {
          const next = prev + 1
          
          // Random Pose Changes for simulation
          if (next > 10 && next < 30) setPoseData({ x: 45, y: 70, posture: 'Sitting' })
          if (next >= 30) setPoseData({ x: 40, y: 85, posture: 'Lying Down' })

          if (next >= 300) setStatus('Alert') // 5 minutes
          return next
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [status])

  return (
    <div className="radar-view fade-in" style={{ padding: '1.5rem', color: 'white', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      <style>{`
        .dense-grid {
          background-image: linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        @keyframes scan-line {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .csi-bar {
          transition: height 0.1s ease;
          width: 4px;
          border-radius: 2px;
          background: var(--accent);
          opacity: 0.6;
        }
        .body-mesh {
          transition: all 1s ease-in-out;
          position: absolute;
          filter: drop-shadow(0 0 10px var(--accent));
        }
      `}</style>

      {/* Main Analysis Area (DensePose Mapping) */}
      <div className="dense-grid" style={{ position: 'relative', background: '#0a0d14', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', animation: 'scan-line 3s linear infinite', zIndex: 5 }}></div>
        
        {/* Room Labels */}
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
          WiFi-DENSEPOSE RECONSTRUCTION v2.1<br />
          SIGNAL: CSI_ANTENNA_ARRAY_A1
        </div>

        {status === 'Monitoring' || status === 'Alert' ? (
          <div className="body-mesh" style={{ top: `${poseData.y}%`, left: `${poseData.x}%`, transform: 'translate(-50%, -50%)' }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
              {/* Human Skeleton Simulation based on Pose */}
              {poseData.posture === 'Standing' && (
                <g stroke="var(--accent)" strokeWidth="2" fill="none">
                  <circle cx="50" cy="20" r="8" />
                  <line x1="50" y1="28" x2="50" y2="60" />
                  <line x1="50" y1="35" x2="30" y2="50" />
                  <line x1="50" y1="35" x2="70" y2="50" />
                  <line x1="50" y1="60" x2="40" y2="90" />
                  <line x1="50" y1="60" x2="60" y2="90" />
                </g>
              )}
              {poseData.posture === 'Sitting' && (
                <g stroke="var(--accent)" strokeWidth="2" fill="none">
                  <circle cx="50" cy="40" r="8" />
                  <line x1="50" y1="48" x2="50" y2="70" />
                  <line x1="50" y1="55" x2="35" y2="65" />
                  <line x1="50" y1="55" x2="65" y2="65" />
                  <line x1="50" y1="70" x2="30" y2="85" />
                  <line x1="50" y1="70" x2="70" y2="85" />
                </g>
              )}
              {poseData.posture === 'Lying Down' && (
                <g stroke={status === 'Alert' ? '#ff4d4d' : 'var(--accent)'} strokeWidth="2" fill="none">
                  <circle cx="20" cy="85" r="8" />
                  <line x1="28" y1="85" x2="60" y2="85" />
                  <line x1="35" y1="85" x2="35" y2="70" />
                  <line x1="50" y1="85" x2="50" y2="70" />
                  <line x1="60" y1="85" x2="85" y2="80" />
                  <line x1="60" y1="85" x2="85" y2="90" />
                </g>
              )}
            </svg>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.65rem', color: status === 'Alert' ? '#ff4d4d' : 'var(--accent)', fontWeight: 'bold' }}>
              {poseData.posture.toUpperCase()}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', opacity: 0.3 }}>
            <Box size={48} />
            <p style={{ marginTop: '1rem' }}>Sinyal Bekleniyor...</p>
          </div>
        )}

        {status === 'Alert' && (
          <div style={{ position: 'absolute', bottom: '2rem', textAlign: 'center', width: '100%', zIndex: 10 }}>
            <div className="pulse" style={{ background: 'rgba(255, 77, 77, 0.2)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid #ff4d4d', display: 'inline-block' }}>
              <ShieldAlert size={24} color="#ff4d4d" style={{ marginBottom: '0.5rem' }} />
              <div style={{ color: '#ff4d4d', fontWeight: 'bold' }}>HAREKETSİZLİK ALARMI</div>
              <div style={{ fontSize: '0.7rem' }}>Saha: Bölge 4 / Oda 102</div>
            </div>
          </div>
        )}
      </div>

      {/* Control & Telemetry Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* CSI Signal Strength */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
          <h4 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={14} /> CSI SINYAL ANALİZİ (dB)
          </h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
            {signalNoise.map((v, i) => (
              <div key={i} className="csi-bar" style={{ height: `${v}%`, background: status === 'Alert' ? '#ff4d4d' : 'var(--accent)' }}></div>
            ))}
          </div>
        </div>

        {/* Status Metrics */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', flex: 1 }}>
          <h4 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1.5rem' }}>DENSEPOSE METRİKLERİ</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Mevcut Duruş</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{status === 'Monitoring' || status === 'Alert' ? poseData.posture : 'N/A'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Hareketsiz Zaman</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: status === 'Alert' ? '#ff4d4d' : 'white' }}>
                {Math.floor(immobilTime / 60)}dk {immobilTime % 60}sn
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Coordinate Regression</span>
              <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>X:{poseData.x.toFixed(2)} Y:{poseData.y.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            {status === 'Standby' ? (
              <button onClick={startCalibration} className="premium-btn" style={{ width: '100%', padding: '1rem', background: 'var(--accent)', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                KALİBRASYONU BAŞLAT
              </button>
            ) : (
              <button onClick={() => { setStatus('Standby'); setImmobilTime(0); setPoseData({x:50, y:50, posture:'Standing'}); }} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>
                SİSTEMİ SIFIRLA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
