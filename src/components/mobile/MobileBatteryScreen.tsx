import type { BatteryOptimizerState } from '../../hooks/useBatteryOptimizer'
import {
  BatteryOptimizerCharts,
  BatteryOptimizerControlsCard,
  BatteryOptimizerDecisionSummary,
  BatteryOptimizerPlanTable,
  BatteryOptimizerStatusCard,
  OptimizerStateBanner,
} from '../battery/BatteryOptimizerSections'
import { BatteryVisual } from '../shared/BatteryVisual'
import type { BatteryPeriod, MobileDashboardProps } from './MobileTypes'
import { BATTERY_PERIODS } from './MobileConstants'
import { GlassCard, MobileLineChart, SmallMetricCard, SectionHeading, SegmentedControl, StatusChip } from './MobilePrimitives'

export function MobileBatteryScreen({
  battery,
  history,
  insights,
  optimizer,
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
  optimizer: BatteryOptimizerState
  period: BatteryPeriod
  onPeriodChange: (period: BatteryPeriod) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="grid gap-4 rounded-[26px] p-4 sm:grid-cols-[1fr_132px_1fr]">
        <div className="flex min-w-0 flex-col justify-center">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-dashboard-muted">State of charge</span>
          <strong className="mt-2 text-[2rem] font-semibold leading-none text-dashboard-text">{battery.soc}%</strong>
          <small className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-dashboard-muted">Stored energy</small>
          <strong className="mt-2 text-[1.15rem] font-semibold text-dashboard-text">{battery.energy} kWh</strong>
        </div>

        <div className="flex items-center justify-center py-2">
          <BatteryVisual level={battery.socValue} />
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-3">
          <StatusChip tone={battery.status === 'Charging' ? 'green' : battery.status === 'Discharging' ? 'danger' : 'neutral'}>
            {battery.status}
          </StatusChip>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2">
            <small className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Power</small>
            <strong className="mt-1 block text-lg font-semibold text-dashboard-text">{battery.power} kW</strong>
          </div>
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2">
            <small className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{insights.runtimeLabel}</small>
            <strong className="mt-1 block text-lg font-semibold text-dashboard-text">{insights.runtimeValue}</strong>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <SmallMetricCard label="Capacity" value={`${battery.capacity} kWh`} />
        <SmallMetricCard label="Charge rate" value={`${insights.chargeRate} kW`} />
        <SmallMetricCard label="Discharge rate" value={`${insights.dischargeRate} kW`} />
        <SmallMetricCard label="Battery power" value={`${battery.power} kW`} />
      </div>

      <GlassCard className="flex flex-col gap-4 rounded-[24px] p-4">
        <div className="flex flex-col gap-3">
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

      <OptimizerStateBanner optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerStatusCard optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerControlsCard optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerPlanTable optimizer={optimizer} planHours={24} variant="mobile" />
      <BatteryOptimizerCharts optimizer={optimizer} variant="mobile" />
    </div>
  )
}
