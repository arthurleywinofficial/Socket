import React, { useState } from 'react'
import { Plus, X, Search, Activity, Tag, Check, Filter } from 'lucide-react'

interface Metric {
  id: string
  name: string
  unit: string
  color: string
}

interface Props {
  availableMetrics: Metric[]
  selectedMetrics: string[]
  onToggle: (id: string) => void
}

const LiveMetricSelector: React.FC<Props> = ({ availableMetrics, selectedMetrics, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMetrics = availableMetrics.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="live-metric-selector">
      <div className="selector-header">
        <div className="selected-tags">
          {selectedMetrics.map(id => {
            const metric = availableMetrics.find(m => m.id === id)
            return (
              <span key={id} className="metric-tag" style={{ borderLeft: `3px solid ${metric?.color || 'var(--accent)'}` }}>
                {metric?.name || id}
                <button onClick={() => onToggle(id)}><X size={14} /></button>
              </span>
            )
          })}
          <button className="add-metric-btn" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={16} /> : <Plus size={16} />}
            <span>Metrik Ekle</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="selector-dropdown panel card fade-in">
          <div className="search-wrap">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Sensör veya metrik ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="metrics-list system-scrollbar">
            {filteredMetrics.length > 0 ? (
              filteredMetrics.map(metric => {
                const isSelected = selectedMetrics.includes(metric.id)
                return (
                  <div 
                    key={metric.id} 
                    className={`metric-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggle(metric.id)}
                  >
                    <div className="metric-info">
                      <div className="metric-color-dot" style={{ backgroundColor: metric.color }} />
                      <span className="metric-name">{metric.name}</span>
                      <span className="metric-id">{metric.id}</span>
                    </div>
                    {isSelected ? <Check size={16} className="check-icon" /> : <Plus size={14} className="plus-icon" />}
                  </div>
                )
              })
            ) : (
              <div className="no-results">Sonuç bulunamadı</div>
            )}
          </div>
          <div className="selector-footer">
            <span>{selectedMetrics.length} metrik seçili</span>
            <button className="btn btn-primary btn-sm" onClick={() => setIsOpen(false)}>Tamam</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMetricSelector
