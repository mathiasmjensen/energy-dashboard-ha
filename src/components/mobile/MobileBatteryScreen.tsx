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
        <div className="mobile-battery-hero-copy mobile-battery-hero-copy--left">
          <span>State of charge</span>
          <strong>{battery.soc}%</strong>
          <small>Stored energy</small>
          <strong className="mobile-battery-hero-subvalue">{battery.energy} kWh</strong>
        </div>

        <div className="mobile-battery-hero-visual">
          <div className="large-battery" style={{ '--battery-level': `${battery.socValue}%` } as CSSProperties}>
            <i />
          </div>
        </div>

        <div className="mobile-battery-hero-copy mobile-battery-hero-copy--right">
          <StatusChip tone={battery.status === 'Charging' ? 'green' : battery.status === 'Discharging' ? 'danger' : 'neutral'}>
            {battery.status}
          </StatusChip>
          <div className="mobile-battery-hero-metric">
            <small>Power</small>
            <strong>{battery.power} kW</strong>
          </div>
          <div className="mobile-battery-hero-metric">
            <small>{insights.runtimeLabel}</small>
            <strong>{insights.runtimeValue}</strong>
          </div>
        </div>
      </GlassCard>

      <div className="mobile-battery-metrics">
        <SmallMetricCard label="Capacity" value={`${battery.capacity} kWh`} />
        <SmallMetricCard label="Charge rate" value={`${insights.chargeRate} kW`} />
        <SmallMetricCard label="Discharge rate" value={`${insights.dischargeRate} kW`} />
        <SmallMetricCard label="Battery power" value={`${battery.power} kW`} />
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
