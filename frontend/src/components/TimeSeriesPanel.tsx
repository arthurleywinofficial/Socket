import { Line } from 'react-chartjs-2'
import type { FC } from 'react'

type Props = {
  title: string
  data: { x: number; y: number }[]
  range: number
  onChangeRange: (value: number) => void
  color?: string
}

const TimeSeriesPanel: FC<Props> = ({ title, data, range, color = '#00d4ff' }) => {
  return (
    <div className="timeseries-panel">
      <div className="panel-meta">
        <div>
          <strong style={{ color: color }}>{title}</strong>
          <p>Canlı veri güncellemesi her saniye yapılır.</p>
        </div>
      </div>
      <div className="timeseries-chart">
        <Line
          data={{
            labels: data.slice(-range).map(point => point.x.toString()),
            datasets: [{
              label: title,
              data: data.slice(-range).map(point => point.y),
              borderColor: color,
              backgroundColor: `${color}22`,
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              borderWidth: 3,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: color,
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: color,
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                displayColors: false
              }
            },
            scales: {
              x: { display: false },
              y: { 
                ticks: { 
                  color: 'rgba(255,255,255,0.4)',
                  font: { size: 10 }
                }, 
                border: { display: false },
                grid: { 
                  color: 'rgba(255,255,255,0.05)',
                } 
              }
            }
          }}
        />
      </div>
    </div>
  )
}

export default TimeSeriesPanel
