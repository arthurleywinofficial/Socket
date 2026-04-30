import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Key, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';

interface LoginPageProps {
  onLogin: (user: string, token: string) => void;
  onShowHelp: () => void;
  onShowPrivacy: () => void;
  registrationTokens: any[];
}

export default function LoginPage({ onLogin, onShowHelp, onShowPrivacy, registrationTokens }: LoginPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regStep, setRegStep] = useState(1); // 1: Token, 2: Account Details
  const [regToken, setRegToken] = useState('');
  const [validToken, setValidToken] = useState<any>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (isRegisterMode) {
      if (regStep === 1) {
        // Step 1: Validate Token
        const found = registrationTokens.find(t => t.token === regToken && !t.used);
        if (found) {
          setValidToken(found);
          setRegStep(2);
          setError('');
        } else {
          setError('Geçersiz veya kullanılmış davet kodu.');
        }
        setIsLoading(false);
      } else {
        // Step 2: Finalize Registration
        setTimeout(() => {
          // Local storage'a yeni kullanıcıyı ekle (Simülasyon)
          const newUser = { username, email, password, level: validToken.level };
          const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
          users.push(newUser);
          localStorage.setItem('socar-registered-users', JSON.stringify(users));
          
          // Token'ı kullanılmış olarak işaretlemek için (App.tsx state'ini de güncellemeli ama şimdilik başarı mesajı)
          onLogin(username, 'mock-token-' + Math.random());
          setIsLoading(false);
        }, 1500);
      }
      return;
    }

    try {
      // Normal Login Logic
      const registeredUsers = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
      const foundLocal = registeredUsers.find((u: any) => u.username === username && u.password === password);
      
      if (foundLocal) {
        onLogin(username, 'local-access-token');
      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok) {
          onLogin(username, data.access_token);
        } else {
          setError(data.detail || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        }
      }
    } catch (err) {
      setError('Sunucu bağlantı hatası.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="login-card slide-in">
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={32} color="var(--accent)" />
          </div>
          <h1>SOCKET</h1>
          <p>{isRegisterMode ? 'Yeni Personel Kaydı' : 'Endüstriyel Veri ve Operasyon Paneli'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error fade-in">{error}</div>}

          {isRegisterMode ? (
            regStep === 1 ? (
              <div className="input-group fade-in">
                <label>Davet Kodu (Token)</label>
                <div className="input-wrapper">
                  <Key size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="SOCAR-XXXX-XXXX"
                    value={regToken}
                    onChange={(e) => setRegToken(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                  Yöneticinizden aldığınız 12 haneli kodu girin.
                </p>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group">
                  <label>Kullanıcı Adı</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input type="text" placeholder="İsim soyisim" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>E-Posta</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input type="email" placeholder="kurumsal@socar.com.tr" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="input-group">
                  <label>Şifre Belirleyin</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 212, 255, 0.05)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--accent)', border: '1px solid rgba(0,212,255,0.1)' }}>
                  Atanan Yetki: <strong>{validToken?.level}</strong>
                </div>
              </div>
            )
          ) : (
            <>
              <div className="input-group">
                <label>Kullanıcı Adı</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input type="text" placeholder="Kullanıcı adınızı girin" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
              </div>
              <div className="input-group">
                <label>Şifre</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : (
              <>
                {isRegisterMode ? (regStep === 1 ? 'Token Doğrula' : 'Kaydı Tamamla') : 'Sisteme Giriş Yap'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div style={{ marginBottom: '1.5rem' }}>
            {isRegisterMode ? (
              <span className="mode-switch" onClick={() => {setIsRegisterMode(false); setRegStep(1);}}>
                <ArrowLeft size={14} /> Giriş Ekranına Dön
              </span>
            ) : (
              <span className="mode-switch" onClick={() => setIsRegisterMode(true)}>
                <UserPlus size={14} /> Yeni Personel Kaydı
              </span>
            )}
          </div>
          <div className="footer-links">
            <span onClick={onShowHelp}>Yardım</span>
            <span onClick={onShowPrivacy}>Gizlilik</span>
          </div>
        </div>
      </div>

      <style>{`
        .login-container { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #090a0f; z-index: 9999; overflow: hidden; font-family: 'Inter', sans-serif; }
        .login-background { position: absolute; inset: 0; overflow: hidden; z-index: 0; }
        .blob { position: absolute; filter: blur(80px); opacity: 0.15; border-radius: 50%; }
        .blob-1 { width: 500px; height: 500px; background: var(--accent); top: -100px; right: -100px; animation: float 20s infinite alternate; }
        .blob-2 { width: 400px; height: 400px; background: #6366f1; bottom: -100px; left: -100px; animation: float 15s infinite alternate-reverse; }
        @keyframes float { from { transform: translate(0, 0); } to { transform: translate(100px, 100px); } }
        .login-card { width: 100%; max-width: 420px; background: rgba(26, 30, 46, 0.45); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; padding: 3rem; position: relative; z-index: 1; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .login-header { text-align: center; margin-bottom: 2rem; }
        .login-logo { width: 60px; height: 60px; background: rgba(0, 212, 255, 0.1); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 1px solid rgba(0, 212, 255, 0.2); }
        .login-header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.5rem; color: #fff; }
        .login-header p { color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; }
        .login-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .login-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 0.75rem; border-radius: 12px; font-size: 0.85rem; text-align: center; }
        .input-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .input-group label { font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.6); margin-left: 0.2rem; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 1rem; color: rgba(255, 255, 255, 0.25); }
        .input-wrapper input { width: 100%; background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 0.9rem 1rem 0.9rem 3rem; color: white; font-size: 0.95rem; transition: all 0.2s; }
        .input-wrapper input:focus { outline: none; border-color: var(--accent); background: rgba(0, 212, 255, 0.05); }
        .password-toggle { position: absolute; right: 1rem; background: none; border: none; color: rgba(255, 255, 255, 0.3); cursor: pointer; padding: 0.5rem; }
        .login-submit-btn { margin-top: 1rem; background: var(--accent); color: #000; border: none; border-radius: 14px; padding: 1rem; font-weight: 700; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; }
        .login-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0, 212, 255, 0.4); }
        .login-footer { margin-top: 2rem; text-align: center; }
        .mode-switch { color: var(--accent); font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; transition: opacity 0.2s; }
        .mode-switch:hover { opacity: 0.8; text-decoration: underline; }
        .footer-links { display: flex; justify-content: center; gap: 1.5rem; margin-top: 1rem; }
        .footer-links span { font-size: 0.8rem; color: rgba(255, 255, 255, 0.3); cursor: pointer; }
        .footer-links span:hover { color: #fff; }
        .spinner { width: 20px; height: 20px; border: 3px solid rgba(0, 0, 0, 0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
