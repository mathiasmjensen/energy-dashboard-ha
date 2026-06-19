import type { CSSProperties } from 'react'
import type { BatteryPeriod, MobileDashboardProps } from './MobileTypes'
import { BATTERY_PERIODS } from './MobileConstants'
import { GlassCard, MobileLineChart, SmallMetricCard, SectionHeading, SegmentedControl, StatusChip } from './MobilePrimitives'

export function MobileBatteryScreen({
  battery,
  history,
  insights,
  period,
  onPeriodChange,
}: {
  battery: MobileDashboardProps['battery']
  history: { labels: string[]; points: number[] }
  insights: {
    chargeRate: string
    dischargeRate: string
    runtimeLabel: string
    runtimeValue: string
  }
  period: BatteryPeriod
  onPeriodChange: (period: BatteryPeriod) => void
}) {
  return (
    <div className="mobile-screen mobile-screen--battery">
      <GlassCard className="mobile-battery-hero-card">
        <div className="mobile-battery-hero-copy">
          <span>State of charge</span>
          <strong>{battery.soc}%</strong>
          <StatusChip tone={battery.status === 'Charging' ? 'green' : battery.status === 'Discharging' ? 'danger' : 'neutral'}>
            {battery.status}
          </StatusChip>
          <div className="mobile-battery-hero-metric">
            <small>Power</small>
            <strong>{battery.power} kW</strong>
          </div>
        </div>

        <div className="mobile-battery-hero-visual">
          <div className="large-battery" style={{ '--battery-level': `${battery.socValue}%` } as CSSProperties}>
            <i />
          </div>
        </div>
      </GlassCard>

      <div className="mobile-battery-metrics">
        <SmallMetricCard label="Stored energy" value={`${battery.energy} kWh`} />
        <SmallMetricCard label="Charge rate" value={`${insights.chargeRate} kW`} />
        <SmallMetricCard label="Discharge rate" value={`${insights.dischargeRate} kW`} />
        <SmallMetricCard label={insights.runtimeLabel} value={insights.runtimeValue} />
      </div>

      <GlassCard className="mobile-section-card">
        <div className="mobile-card-stack">
          <SectionHeading title="Battery history" />
          <SegmentedControl
            active={period}
            ariaLabel="Battery history period"
            options={BATTERY_PERIODS}
            onChange={(value) => onPeriodChange(value as BatteryPeriod)}
          />
        </div>

        <MobileLineChart color="#4fd55f" labels={history.labels} points={history.points} unit="%" />
      </GlassCard>
    </div>
  )
}
