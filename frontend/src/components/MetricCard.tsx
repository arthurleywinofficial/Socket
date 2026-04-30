import { Loader2 } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import type { FC } from 'react'

type Props = {
  title: string
  value: number
  unit: string
  status: string
  trendData: any
  updated: boolean
}

const MetricCard: FC<Props> = ({ title, value, unit, status, trendData, updated }) => {
  const statusText = status === 'warning' ? 'Uyarı' : 'Normal'

  return (
    <div className={`metric-card card fade-in-up ${status === 'warning' ? 'alarm-pulse' : ''}`}>
      <div className="metric-card-top">
        <div>
          <span>{title}</span>
          <p>{statusText}</p>
        </div>
        <div className="metric-card-update">
          {updated ? <Loader2 className="spin-icon" size={16} /> : null}
        </div>
      </div>
      <div className="metric-card-value">
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <div className="metric-chart">
        <Line data={trendData} options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }} />
      </div>
    </div>
  )
}

export default MetricCard
