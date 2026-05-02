import React, { useState, useEffect } from 'react'
import { Shield, Lock, User, Terminal, Cpu, Zap, Activity } from 'lucide-react'

interface Props {
  onLogin: (username: string, token: string, role?: string, id?: string) => void
  onShowHelp: () => void
  onShowPrivacy: () => void
  registrationTokens: any[]
}

const LoginPage: React.FC<Props> = ({ onLogin, onShowHelp, onShowPrivacy, registrationTokens }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isHovered, setIsHovered] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem('socar-registered-users') || '[]')
    const user = users.find((u: any) => u.username === username && u.password === password)

    if (user) {
      onLogin(user.username, 'mock-token-' + Date.now(), user.level, user.userId)
    } else if (username === 'Arthur' && password === '1242') {
      // 🛡️ DEVELOPER BACKDOOR: Bu ID App.tsx'de 'Geliştirici' yetkisini tetikler
      onLogin('Arthur', 'mock-token-dev', 'Geliştirici', '99999999999')
    } else if (username === 'Deneme' && password === '1234') {
      onLogin('Deneme', 'mock-token-v1', 'Operatör', '10002000300')
    } else {
      setError('Geçersiz kimlik bilgileri. Lütfen birim yöneticinizle iletişime geçin.')
    }
  }

  return (
    <div className="login-page">
      <style>{`
        .login-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05070a;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .login-bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(80px);
          z-index: 0;
        }

        .login-card {
          width: 400px;
          padding: 3rem;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          background: var(--accent, #00d4ff);
          border-radius: 20px;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
        }

        .login-header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: -1px;
        }

        .login-header p {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.85rem;
          margin-bottom: 2.5rem;
        }

        .input-group {
          position: relative;
          margin-bottom: 1.25rem;
        }

        .input-group input {
          width: 100%;
          padding: 1.2rem 1.5rem 1.2rem 3.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          color: white;
          font-size: 0.95rem;
          transition: all 0.3s;
        }

        .input-group input:focus {
          border-color: var(--accent);
          background: rgba(0, 212, 255, 0.05);
          outline: none;
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.2);
        }

        .login-btn {
          width: 100%;
          padding: 1.2rem;
          background: var(--accent);
          color: #000;
          border: none;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
          transition: 0.3s;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 212, 255, 0.4);
        }

        .footer-links {
          margin-top: 2rem;
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.3);
        }

        .footer-links span { cursor: pointer; transition: 0.2s; }
        .footer-links span:hover { color: var(--accent); }

        .error-toast {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }
      `}</style>

      <div className="login-bg-glow" />
      
      <div className="login-card fade-in-up">
        <div className="login-logo">
          <Shield color="#000" size={40} />
        </div>
        
        <div className="login-header">
          <h1>SOCKET</h1>
          <p>Endüstriyel Veri Güvenliği Altyapısı</p>
        </div>

        {error && <div className="error-toast">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            Sisteme Giriş Yap
          </button>
        </form>

        <div className="footer-links">
          <span onClick={onShowHelp}>Yardım Merkezi</span>
          <span onClick={onShowPrivacy}>BT Güvenlik</span>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
