import React, { useState, useEffect, useRef } from 'react'
import { Activity, Terminal, Shield, Cpu, Wifi, Map as MapIcon } from 'lucide-react'

const RadarView: React.FC = () => {
  const [status, setStatus] = useState('Link_Pending')
  const [angle, setAngle] = useState(0)
  const [nodes, setNodes] = useState<any[]>([])
  const [csiStream, setCsiStream] = useState<number[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let frame: number
    const update = () => {
      setAngle(prev => (prev + 2.5) % 360)
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    socketRef.current = new WebSocket('ws://127.0.0.1:8765')
    socketRef.current.onopen = () => setStatus('Link_Live')
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setNodes(data.nodes)
      setCsiStream(data.csi)
    }
    socketRef.current.onclose = () => setStatus('Link_Disconnected')
    return () => socketRef.current?.close()
  }, [])

  // 📐 Otomatik Oda Tahmini (En dış noktaları birleştirme mantığı)
  const sortedNodes = [...nodes].sort((a, b) => {
    const angleA = Math.atan2(a.y - 50, a.x - 50)
    const angleB = Math.atan2(b.y - 50, b.x - 50)
    return angleA - angleB
  })

  return (
    <div className="radar-view" style={{ padding: '1.5rem', height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', background: '#05070a', color: 'white' }}>
      <style>{`
        .radar-container {
          background: #080a0f;
          border-radius: 32px;
          border: 1px solid rgba(0, 212, 255, 0.1);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sweep-beam {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 50%;
          height: 100px;
          background: conic-gradient(from 0deg, var(--accent) 0deg, transparent 60deg);
          transform-origin: top left;
          opacity: 0.15;
          pointer-events: none;
        }
        .node-point {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 15px var(--accent);
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
        }
        .room-boundary {
          fill: rgba(0, 212, 255, 0.03);
          stroke: var(--accent);
          stroke-width: 1;
          stroke-dasharray: 5 5;
          opacity: 0.4;
        }
        .grid-circle {
          position: absolute;
          border: 1px solid rgba(0, 212, 255, 0.05);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          left: 50%;
          top: 50%;
        }
      `}</style>

      {/* 🧭 Ana Radar Ekranı */}
      <div className="radar-container">
        {[20, 40, 60, 80].map(r => (
          <div key={r} className="grid-circle" style={{ width: `${r}%`, height: `${r}%` }}></div>
        ))}
        
        <div className="sweep-beam" style={{ transform: `rotate(${angle - 60}deg)` }}></div>

        {/* 📐 Tahmini Oda Planı (Polygon) */}
        {sortedNodes.length > 2 && (
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            <polygon 
              points={sortedNodes.map(n => `${(n.x / 100) * 1000},${(n.y / 100) * 1000}`).join(' ')} 
              viewBox="0 0 1000 1000"
              className="room-boundary"
            />
          </svg>
        )}

        {/* 📡 Aktif Cihazlar/Reflektörler */}
        {nodes.map((n, i) => (
          <div 
            key={i} 
            className="node-point" 
            style={{ 
              left: `${n.x}%`, 
              top: `${n.y}%`, 
              opacity: n.intensity,
              transform: `translate(-50%, -50%) scale(${0.8 + n.intensity * 0.4})`
            }}
          >
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', whiteSpace: 'nowrap', opacity: 0.5 }}>
              {n.mac?.slice(-5)}
            </div>
          </div>
        ))}

        <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: status === 'Link_Live' ? 'var(--accent)' : '#ff4d4d' }}>
            <Wifi size={24} className="pulse" />
            <span style={{ letterSpacing: '4px', fontWeight: 'bold' }}>{status.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.4rem' }}>AUTONOMOUS SLAM MODE v1.9.5</div>
        </div>
      </div>

      {/* 📊 Bilgi Paneli */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <Terminal size={18} /> SİSTEM ANALİZİ
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ padding: '1.2rem', background: 'rgba(0,212,255,0.05)', borderRadius: '20px' }}>
              <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Tespit Edilen Cihaz</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{nodes.length} Adet</div>
            </div>

            <div style={{ padding: '1.2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '20px' }}>
              <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Oda Formu Güveni</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent)' }}>%{Math.min(99, nodes.length * 15)}</div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ fontSize: '0.6rem', opacity: 0.4, marginBottom: '0.8rem' }}>CSI PHASE PATTERN</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
              {csiStream.map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--accent)', opacity: 0.3, borderRadius: '2px' }}></div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '0.65rem', opacity: 0.6 }}>
             <strong>NOT:</strong> Noktalar arası kesikli çizgiler, cihazların konumuna göre tahmin edilen oda sınırlarıdır.
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadarView
