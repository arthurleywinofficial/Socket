import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Layout, Activity, AlertCircle, Megaphone } from 'lucide-react';
import { API_BASE } from '../config';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface AIAssistantProps {
  onNavigate: (page: string) => void;
  systemStatus: any;
  toggleMetric?: (id: string) => void;
  selectedMetrics?: string[];
  token?: string | null;
}

export default function AIAssistant({ onNavigate, systemStatus, toggleMetric, selectedMetrics, token }: AIAssistantProps) {
  if (!token) return null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Proaktif Analiz: Verilerde anomali veya aktif alarm var mı kontrol et
  useEffect(() => {
    if (!systemStatus || isOpen) return;

    const env = systemStatus.environment || {};
    const sim = systemStatus.simulator || {};
    const safety = systemStatus.safety || {};
    
    // 1. Aktif Alarmlar (Kritik Öncelik)
    if (safety.active_alarms > 0) {
      setHintText(`${safety.active_alarms} adet aktif alarm tespit edildi! Analiz edelim mi?`);
      setShowHint(true);
      return;
    }

    // 2. Eşik Değerleri
    if (env.temperature > 45 || sim.gas_h2s_zone1 > 10) {
      setHintText("Kritik eşik aşımı tespit edildi! Analiz için tıklayın.");
      setShowHint(true);
    } else if (env.humidity > 80) {
      setHintText("Yüksek nem oranı. Ekipman sağlığını kontrol edelim mi?");
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [systemStatus, isOpen]);

  const getSystemContext = () => {
    if (!systemStatus) return "Sistem verilerine şu an ulaşılamıyor.";
    const env = systemStatus.environment || {};
    const sim = systemStatus.simulator || {};
    const p = systemStatus.personnel || {};
    const safety = systemStatus.safety || {};
    
    return `Güncel Sistem Durumu:
- Aktif Alarmlar: ${safety.active_alarms ?? 0}
- ESD Durumu: ${safety.esd_status ?? 'Bilinmiyor'} (${safety.esd_reason ?? '-'})
- Sıcaklık: ${env.temperature ?? 'N/A'}°C, Nem: %${env.humidity ?? 'N/A'}, Basınç: ${env.pressure ?? 'N/A'} hPa
- Personel: Toplam ${p.total ?? 0}, Güvende ${p.safe ?? 0}, Tahliye Edilen ${p.evacuated ?? 0}
- Simülatör: Bölge1 Sıcaklık: ${sim.temp_zone1 ?? 'N/A'}°C, H2S Gazı: ${sim.gas_h2s_zone1 ?? 'N/A'} ppm
- Dashboard Aktif Metrikler: ${selectedMetrics?.join(', ') || 'Yok'}`;
  };

  const SYSTEM_PROMPT = `Senin adın Socket. SOCAR Operasyon Kontrol ve Endüstriyel Takip platformunun resmi yapay zeka asistanısın. 
Sen bir "Akıllı Operasyon Ortağı" gibi davranmalısın. Sadece soru cevaplamakla kalma, verileri analiz et ve önerilerde bulun.

DİL VE ÜSLUP:
- Sadece TÜRKÇE konuşmalısın. Asla başka dillerden (İngilizce, Çince vb.) kelime kullanma.
- Kurumsal, profesyonel ve çözüm odaklı bir dil kullan.

YETKİLERİN VE ARAÇ KULLANIMI:
- Araçları (tools) kullanırken teknik detayları (etiketler, JSON vb.) asla metin olarak kullanıcıya gösterme.
- Sadece senin doğal dildeki cevabın görünmeli.

GÖREVLERİN:
- Eğer aktif alarm varsa (active_alarms > 0), kullanıcıya mutlaka bu durumdan bahset ve 'alarms' sayfasına gitmesini öner.
- Verileri yorumlayarak risk analizi yap.
- Eğer kullanıcı bir duyuru yapmak isterse 'post_announcement' aracını kullan.

${getSystemContext()}`;

  const tools = [
    {
      type: 'function',
      function: {
        name: 'navigate_to_page',
        description: 'Uygulama içerisinde farklı sayfalara veya menülere geçiş yapar.',
        parameters: {
          type: 'object',
          properties: {
            pageId: { type: 'string', enum: ['dashboard', 'live', 'map', 'charts', 'analysis', 'production', 'personnel', 'alarms', 'status'] },
            pageName: { type: 'string' }
          },
          required: ['pageId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'toggle_dashboard_metric',
        description: 'Dashboard üzerindeki kutucukları açar veya kapatır.',
        parameters: {
          type: 'object',
          properties: {
            metricId: { type: 'string', enum: ['temp', 'hum', 'press', 'gas', 'noise', 'power'] }
          },
          required: ['metricId']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'post_announcement',
        description: 'Tüm sistem kullanıcıları için yeni bir duyuru yayınlar.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Duyuru başlığı' },
            content: { type: 'string', description: 'Duyuru içeriği' }
          },
          required: ['title', 'content']
        }
      }
    }
  ];

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    setShowHint(false);

    try {
      const res1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...currentMessages.map(m => ({ role: m.role, content: m.content, tool_calls: m.tool_calls }))],
          tools,
          tool_choice: 'auto'
        })
      });

      const data1 = await res1.json();
      const message1 = data1.choices[0].message;

      if (message1.tool_calls) {
        const toolResponses: Message[] = [];

        for (const toolCall of message1.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          
          if (toolCall.function.name === 'navigate_to_page') {
            onNavigate(args.pageId);
            toolResponses.push({ role: 'tool', tool_call_id: toolCall.id, name: 'navigate_to_page', content: 'Yönlendirme yapıldı.' });
          } else if (toolCall.function.name === 'toggle_dashboard_metric' && toggleMetric) {
            toggleMetric(args.metricId);
            toolResponses.push({ role: 'tool', tool_call_id: toolCall.id, name: 'toggle_dashboard_metric', content: 'Metrik güncellendi.' });
          } else if (toolCall.function.name === 'post_announcement') {
            const res = await fetch(`${API_BASE}/api/announcements/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ title: args.title, content: args.content })
            });
            const result = await res.json();
            toolResponses.push({ role: 'tool', tool_call_id: toolCall.id, name: 'post_announcement', content: res.ok ? 'Duyuru yayınlandı.' : 'Hata: ' + (result.detail || 'Bilinmeyen hata') });
          }
        }

        const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...currentMessages.map(m => ({ role: m.role, content: m.content })),
              { role: 'assistant', content: message1.content, tool_calls: message1.tool_calls },
              ...toolResponses.map(m => ({ role: 'tool', tool_call_id: m.tool_call_id, name: m.name, content: m.content }))
            ]
          })
        });
        const data2 = await res2.json();
        const finalContent = (data2.choices[0].message.content || '').replace(/<function=.*?<\/function>/gs, '').trim();
        setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
      } else {
        const finalContent = (message1.content || '').replace(/<function=.*?<\/function>/gs, '').trim();
        if (finalContent) {
          setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası oluştu.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
        .ai-fab {
          width: 50px !important;
          height: 50px !important;
          ...
        }
      `}</style>
      {showHint && (
        <div 
          id="socket-alert-ultra"
          style={{
            position: 'fixed !important',
            top: '160px !important',
            left: '50% !important',
            transform: 'translateX(-50%) !important',
            background: 'rgba(0, 212, 255, 0.95) !important',
            color: '#000 !important',
            padding: '0 12px !important',
            borderRadius: '12px !important',
            width: '90% !important',
            maxWidth: '350px !important',
            height: '44px !important',
            display: 'flex !important',
            alignItems: 'center !important',
            justifyContent: 'space-between !important',
            boxShadow: '0 10px 40px rgba(0,212,255,0.4) !important',
            zIndex: '99999999 !important',
            border: '1px solid white !important',
            backdropFilter: 'blur(10px) !important'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>{hintText}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
            style={{ 
              background: '#000 !important', 
              color: '#fff !important',
              border: 'none !important', 
              borderRadius: '50% !important', 
              height: '28px !important',
              width: '28px !important',
              cursor: 'pointer !important', 
              display: 'flex !important',
              alignItems: 'center !important',
              justifyContent: 'center !important'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <button className={`ai-fab ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="fab-glow" />
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {!isOpen && <div className="fab-badge"><Sparkles size={10} /></div>}
      </button>

      {isOpen && (
        <div className="ai-chat-window slide-in-up">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar"><Bot size={20} color="var(--accent)" /><span className="ai-status-dot pulse" /></div>
              <div className="ai-header-text"><span className="ai-name">Socket AI</span><span className="ai-subtitle">Aktif Operasyon Ortağı</span></div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>

          <div className="ai-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <div className="welcome-icon-wrapper"><Bot size={48} className="ai-welcome-icon" /><Sparkles size={20} className="sparkle-1" /></div>
                <h3>Merhaba, Ben Socket</h3>
                <p>Verileri analiz edebilir, duyuru yayınlayabilir ve paneli sizin için yönetebilirim.</p>
                <div className="ai-suggestions-grid">
                  <div className="suggestion-card" onClick={() => handleSend('Genel durumu analiz et.')}><Activity size={18} /><span>Genel Analiz</span></div>
                  <div className="suggestion-card" onClick={() => handleSend('Tüm personele dikkatli olmaları için bir duyuru yap.')}><Megaphone size={18} /><span>Duyuru Yap</span></div>
                  <div className="suggestion-card" onClick={() => handleSend('Dashboard\'a tüm metrikleri ekle.')}><Layout size={18} /><span>Metrik Yönetimi</span></div>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => msg.role !== 'tool' && (
              <div key={idx} className={`ai-message-row ${msg.role}`}><div className="ai-message-bubble">{msg.content}</div></div>
            ))}
            {isLoading && <div className="ai-message-row assistant"><div className="ai-message-bubble loading"><Loader2 size={20} className="animate-spin" /><span>Analiz ediliyor...</span></div></div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-area">
            <input type="text" placeholder="Operasyonel bir talimat verin..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
            <button className="ai-send-btn" onClick={() => handleSend()} disabled={!input.trim() || isLoading}><Send size={18} /></button>
          </div>
        </div>
      )}

      <style>{`
        .ai-assistant-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 10000; font-family: 'Inter', sans-serif; }
        .socket-ai-alert-v2 {
          position: fixed !important; 
          top: 120px !important; /* Header 110px + 10px boşluk */
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #00d4ff !important; 
          color: #000 !important;
          padding: 0 16px !important; 
          border-radius: 12px !important; 
          font-size: 0.85rem !important; 
          font-weight: 800 !important; 
          width: 90% !important;
          max-width: 400px !important;
          height: 48px !important;
          min-height: 48px !important;
          max-height: 48px !important;
          display: flex !important; 
          align-items: center !important; 
          justify-content: space-between !important;
          gap: 10px !important; 
          box-shadow: 0 10px 40px rgba(0,212,255,0.4) !important;
          z-index: 10000 !important;
          border: 2px solid rgba(255,255,255,0.4) !important;
          overflow: hidden !important;
        }
        .hint-content {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          flex: 1 !important;
          overflow: hidden !important;
        }
        .hint-content span {
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .hint-close {
          flex-shrink: 0 !important;
          background: rgba(0,0,0,0.15) !important;
          color: #000 !important;
          border-radius: 8px !important;
          padding: 6px !important;
          display: flex !important;
          border: none !important;
          cursor: pointer !important;
        }
        .ai-hint-bubble:hover { transform: translateX(-50%) scale(1.05); background: #fff; }
        @keyframes slideDown { from { transform: translate(-50%, -100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
        .ai-fab {
          width: 60px; height: 60px; border-radius: 20px; background: var(--accent); color: #000; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 212, 255, 0.4); position: relative; transition: 0.3s;
        }
        .ai-fab:hover { transform: scale(1.05); }
        .fab-glow { position: absolute; inset: -4px; background: var(--accent); opacity: 0.2; filter: blur(10px); border-radius: 24px; }
        .ai-chat-window {
          position: absolute; bottom: 80px; right: 0; width: 400px; height: 600px;
          background: rgba(15, 17, 23, 0.45); backdrop-filter: blur(40px) saturate(180%); 
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 32px; display: flex; flex-direction: column; box-shadow: 0 25px 80px rgba(0,0,0,0.6);
          overflow: hidden;
        }
        .ai-chat-header { 
          padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; 
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.08); 
        }
        .ai-header-info { display: flex; align-items: center; gap: 0.75rem; }
        .ai-avatar { position: relative; width: 36px; height: 36px; background: rgba(0, 212, 255, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .ai-status-dot { position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #10b981; border-radius: 50%; border: 2.5px solid rgba(15, 17, 23, 0.5); }
        .pulse { animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { transform: scale(0.9); } }
        .ai-name { display: block; font-weight: 700; font-size: 1rem; color: #fff; }
        .ai-subtitle { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
        .ai-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .ai-welcome { text-align: center; padding: 1rem 0.5rem; }
        .ai-welcome-icon { color: var(--accent); margin-bottom: 1.5rem; }
        .ai-suggestions-grid { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
        .suggestion-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
          padding: 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: 0.2s;
          width: 100%; box-sizing: border-box;
        }
        .suggestion-card:hover { background: rgba(0, 212, 255, 0.15); border-color: rgba(0, 212, 255, 0.3); transform: translateX(5px); }
        .suggestion-card span { font-size: 0.9rem; color: rgba(255,255,255,0.9); font-weight: 500; text-align: left; }
        .ai-message-row { display: flex; width: 100%; margin-bottom: 0.25rem; }
        .ai-message-row.user { justify-content: flex-end; }
        .ai-message-bubble { max-width: 85%; padding: 1rem 1.25rem; border-radius: 18px; font-size: 0.95rem; line-height: 1.6; }
        .user .ai-message-bubble { background: var(--accent); color: #000; border-bottom-right-radius: 2px; box-shadow: 0 4px 15px rgba(0,212,255,0.2); }
        .assistant .ai-message-bubble { background: rgba(255,255,255,0.08); color: #fff; border-bottom-left-radius: 2px; }
        .ai-input-area { padding: 1.25rem; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 0.75rem; }
        .ai-input-area input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.75rem 1rem; color: #fff; font-size: 0.9rem; outline: none; transition: 0.2s; }
        .ai-input-area input:focus { border-color: var(--accent); background: rgba(255,255,255,0.08); }
        .ai-send-btn { width: 44px; height: 44px; border-radius: 10px; background: var(--accent); color: #000; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .ai-send-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        .ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .loading { display: flex; align-items: center; gap: 0.5rem; opacity: 0.7; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
