import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Settings, Shield, Bell } from 'lucide-react';

interface UserMenuProps {
  username: string;
  userRole: string; // Yeni özellik
  onLogout: () => void;
  onNavigate: (page: string) => void;
  theme: 'dark' | 'light';
}

const UserMenu: React.FC<UserMenuProps> = ({ username, userRole, onLogout, onNavigate, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (pageId: string) => {
    onNavigate(pageId);
    setIsOpen(false);
  };

  return (
    <div className="user-menu-container" ref={menuRef} style={{ position: 'relative' }}>
      <button 
        className="user-profile-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 1.25rem',
          borderRadius: '16px',
          background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          cursor: 'pointer',
          transition: '0.2s',
          height: '48px'
        }}
      >
        <div className="user-avatar" style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent), #1b2d58)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <User size={18} />
        </div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: theme === 'dark' ? '#fff' : '#0f172a' }}>{username}</span>
          <span style={{ fontSize: '0.7rem', color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{userRole}</span>
        </div>
        <ChevronDown size={16} style={{ 
          color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: '0.3s'
        }} />
      </button>

      {isOpen && (
        <div className="user-dropdown-menu fade-in" style={{
          position: 'absolute',
          top: 'calc(100% + 0.75rem)',
          right: '50%',
          transform: 'translateX(50%)',
          width: '220px',
          background: theme === 'dark' ? 'rgba(15, 17, 23, 0.95)' : '#fff',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          padding: '0.75rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.5rem', borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hesap Yönetimi</span>
          </div>
          
          <button className="dropdown-item" onClick={() => handleAction('profile')}>
            <User size={18} />
            <span>Profilim</span>
          </button>
          <button className="dropdown-item" onClick={() => handleAction('settings')}>
            <Settings size={18} />
            <span>Ayarlar</span>
          </button>
          <button className="dropdown-item" onClick={() => handleAction('notifications')}>
            <Bell size={18} />
            <span>Bildirimler</span>
          </button>
          <button className="dropdown-item" onClick={() => handleAction('status')}>
            <Shield size={18} />
            <span>Güvenlik</span>
          </button>
          
          <div style={{ margin: '0.5rem 0', borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }} />
          
          <button className="dropdown-item logout" onClick={onLogout}>
            <LogOut size={18} />
            <span>Çıkış Yap</span>
          </button>

          <style>{`
            .dropdown-item {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.75rem 1rem;
              border-radius: 12px;
              border: none;
              background: transparent;
              color: var(--text-primary);
              cursor: pointer;
              transition: 0.2s;
              font-size: 0.85rem;
              font-weight: 500;
              width: 100%;
              text-align: left;
            }
            .dropdown-item:hover {
              background: rgba(255,255,255,0.05);
              transform: translateX(4px);
            }
            .dropdown-item.logout {
              color: #ef4444;
            }
            .dropdown-item.logout:hover {
              background: rgba(239, 68, 68, 0.1);
            }
            .user-profile-btn:hover {
              transform: translateY(-2px);
              border-color: var(--accent);
              box-shadow: 0 10px 20px rgba(0, 212, 255, 0.1);
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
