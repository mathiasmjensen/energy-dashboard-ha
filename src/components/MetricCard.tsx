import { EnergyIcon, type EnergyIconName } from './EnergyIcon'
import { GlassPanel } from './GlassPanel'
import { Sparkline } from './Sparkline'

type MetricCardProps = {
  accent: 'cyan' | 'green' | 'yellow'
  icon: EnergyIconName
  title: string
  value: string
  unit: string
  subValue: string
  subLabel?: string
}

export function MetricCard({
  accent,
  icon,
  title,
  value,
  unit,
  subValue,
  subLabel,
}: MetricCardProps) {
  return (
    <GlassPanel accent={accent} className="metric-card">
      <EnergyIcon name={icon} className="metric-card__icon" />
      <div className="metric-card__body">
        <h2>{title}</h2>
        <div className="metric-card__value">
          <span>{value}</span>
          <small>{unit}</small>
        </div>
        <p>
          <span>{subValue}</span>
          {subLabel ? <small>{subLabel}</small> : null}
        </p>
      </div>
      <Sparkline accent={accent} />
    </GlassPanel>
  )
}
