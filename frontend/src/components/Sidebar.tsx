import { Menu, type LucideProps } from 'lucide-react'
import type { ComponentType, FC } from 'react'

type SidebarItem = {
  id: string
  label: string
  icon: ComponentType<LucideProps>
}

type SidebarSection = {
  title: string
  items: SidebarItem[]
}

type Props = {
  menu: SidebarSection[]
  selected: string
  onSelect: (page: string) => void
  theme: string
  toggleTheme: () => void
}

const Sidebar: FC<Props> = ({ menu, selected, onSelect, theme, toggleTheme }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div>
          <img src="/socket-logo.png" alt="SOCKET Logo" style={{width: '64px', height: '64px', objectFit: 'contain', borderRadius: '12px'}}/>
          <div>
            <strong style={{fontSize: '1.4rem', letterSpacing: '0.5px'}}>SOCKET</strong>
            <p style={{fontSize: '10px', lineHeight: 1.2, marginTop: '2px'}}>SOCAR Operasyon Kontrol<br/>ve Endüstriyel Takip</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menu.map(section => (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={selected === item.id ? 'sidebar-item active' : 'sidebar-item'}
                onClick={() => {
                  onSelect(item.id)
                  document.body.classList.remove('sidebar-open')
                }}
              >
                <item.icon size={18} className="sidebar-item-icon" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>v1.0.7</span>
      </div>
    </aside>
  )
}

export default Sidebar
