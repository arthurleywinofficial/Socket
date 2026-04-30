import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { API_BASE } from '../config';

interface LoginPageProps {
  onLogin: (user: string, token: string) => void;
  onShowHelp: () => void;
  onShowPrivacy: () => void;
}

export default function LoginPage({ onLogin, onShowHelp, onShowPrivacy }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
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
        setError(data.detail || 'Giriş başarısız.');
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
            <img src="/socket-logo.png" alt="SOCKET" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} />
          </div>
          <h1>SOCKET</h1>
          <p>Endüstriyel Veri ve Operasyon Paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error fade-in">
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Kullanıcı adınızı girin"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Şifre</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner"></div>
            ) : (
              <>
                Sisteme Giriş Yap
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 SOCKET Industrial Solutions</p>
          <div className="footer-links">
            <span onClick={onShowHelp}>Yardım</span>
            <span onClick={onShowPrivacy}>Gizlilik</span>
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #090a0f;
          z-index: 9999;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .login-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.15;
          border-radius: 50%;
        }

        .blob-1 {
          width: 500px;
          height: 500px;
          background: var(--accent);
          top: -100px;
          right: -100px;
          animation: float 20s infinite alternate;
        }

        .blob-2 {
          width: 400px;
          height: 400px;
          background: #6366f1;
          bottom: -100px;
          left: -100px;
          animation: float 15s infinite alternate-reverse;
        }

        @keyframes float {
          from { transform: translate(0, 0); }
          to { transform: translate(100px, 100px); }
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(26, 30, 46, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 3rem;
          position: relative;
          z-index: 1;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          width: 64px;
          height: 64px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }

        .login-header h1 {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          text-align: center;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 0.2rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: rgba(255, 255, 255, 0.3);
        }

        .input-wrapper input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 0.85rem 1rem 0.85rem 3rem;
          color: white;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--accent);
          background: rgba(0, 212, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
        }

        /* Autofill overrides */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #090a0f inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.5rem;
        }

        .login-submit-btn {
          margin-top: 1rem;
          background: var(--accent);
          color: #000;
          border: none;
          border-radius: 14px;
          padding: 1rem;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 10px 20px -5px rgba(0, 212, 255, 0.4);
        }

        .login-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
        }

        .login-footer p {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.75rem;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }

        .footer-links span {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: color 0.2s;
        }

        .footer-links span:hover {
          color: var(--accent);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
