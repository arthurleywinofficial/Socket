import React, { useState } from 'react';
import { Flame, Droplets, Thermometer, ShieldAlert, X, Zap } from 'lucide-react';
import { API_BASE } from '../config';

interface CrisisSimulatorProps {
  token?: string | null;
}

export default function CrisisSimulator({ token }: CrisisSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const triggerCrisis = async (type: string) => {
    setStatus('Tetikleniyor...');
    try {
      const res = await fetch(`${API_BASE}/api/safety/simulate-crisis?crisis_type=${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        setStatus('Kriz Başarıyla Tetiklendi!');
        setTimeout(() => setStatus(null), 3000);
      } else {
        const err = await res.json();
        setStatus(`Hata: ${err.detail || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      setStatus('Bağlantı Hatası!');
    }
  };

  const triggerESD = async () => {
    setStatus('ESD Tetikleniyor...');
    try {
      const res = await fetch(`${API_BASE}/api/safety/esd/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: "Suni Kriz Simülasyonu - Acil Kapatma" })
      });
      
      if (res.ok) {
        setStatus('ESD AKTİF!');
        setTimeout(() => setStatus(null), 3000);
      } else {
        const err = await res.json();
        setStatus(`Hata: ${err.detail || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      setStatus('Bağlantı Hatası!');
    }
  };

  return (
    <div className="crisis-simulator-container">
      <button 
        className={`simulator-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Kriz Simülatörü"
      >
        <Zap size={20} />
      </button>

      {isOpen && (
        <div className="simulator-panel slide-in-up">
          <div className="simulator-header">
            <h3>Suni Kriz Merkezi</h3>
            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          
          <div className="simulator-content">
            <p>Sistemi ve AI asistanını test etmek için bir kriz senaryosu seçin:</p>
            
            <div className="crisis-options">
              <button className="crisis-btn gas" onClick={() => triggerCrisis('gas_leak')}>
                <Droplets size={18} />
                <span>Gaz Sızıntısı (H2S)</span>
              </button>
              
              <button className="crisis-btn fire" onClick={() => triggerCrisis('fire')}>
                <Flame size={18} />
                <span>Yangın Alarmı</span>
              </button>
              
              <button className="crisis-btn temp" onClick={() => triggerCrisis('temp_critical')}>
                <Thermometer size={18} />
                <span>Yüksek Sıcaklık</span>
              </button>
              
              <div className="divider" />
              
              <button className="crisis-btn esd" onClick={triggerESD}>
                <ShieldAlert size={18} />
                <span>ESD (ACİL KAPATMA)</span>
              </button>
            </div>
            
            {status && (
              <div className={`simulator-status ${status.includes('Hata') ? 'error' : 'success'}`}>
                {status}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .crisis-simulator-container {
          position: fixed;
          bottom: 2rem;
          right: 6.5rem;
          z-index: 1000;
        }

        .simulator-fab {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: #f59e0b;
          color: #000;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
          transition: all 0.3s;
        }

        .simulator-fab:hover {
          transform: scale(1.1);
          background: #fbbf24;
        }

        .simulator-fab.active {
          background: #ef4444;
          color: #fff;
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
        }

        .simulator-panel {
          position: absolute;
          bottom: 60px;
          right: 0;
          width: 300px;
          background: rgba(15, 17, 23, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1.25rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .simulator-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .simulator-header h3 {
          font-size: 1rem;
          color: #fff;
          margin: 0;
        }

        .simulator-header button {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
        }

        .simulator-content p {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }

        .crisis-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .crisis-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.03);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .crisis-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        .crisis-btn.gas:hover { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.05); }
        .crisis-btn.fire:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        .crisis-btn.temp:hover { border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
        .crisis-btn.esd { 
          background: rgba(239, 68, 68, 0.1); 
          border-color: rgba(239, 68, 68, 0.2); 
          color: #ef4444; 
          font-weight: 700;
          margin-top: 0.5rem;
        }
        .crisis-btn.esd:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 0.25rem 0;
        }

        .simulator-status {
          margin-top: 1rem;
          padding: 0.6rem;
          border-radius: 8px;
          font-size: 0.75rem;
          text-align: center;
          font-weight: 600;
        }

        .simulator-status.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .simulator-status.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        @keyframes slide-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-in-up { animation: slide-in-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
