import type { ReactNode } from 'react'
import type { BatteryOptimizerState } from '../../models/batteryOptimizer'
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
import { GlassCard, MobileDataStateBadge, MobileLineChart, SectionHeading, SegmentedControl, StatusChip } from './MobilePrimitives'

const MOBILE_OPTIMIZER_SECTIONS = ['status', 'plan', 'charts'] as const
type MobileOptimizerSection = (typeof MOBILE_OPTIMIZER_SECTIONS)[number]

export function MobileBatteryDetailsSection({
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
    <>
      <GlassCard className="grid gap-4 rounded-[26px] p-4">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading title="Battery status" />
          <MobileDataStateBadge badge={battery.dataState} />
        </div>

        <div className="grid grid-cols-[1fr_124px] gap-4">
          <div className="grid content-start gap-3">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Battery state</span>
              <strong className="mt-2 block text-[2rem] font-semibold leading-none text-dashboard-text">{battery.soc}%</strong>
              <span className="mt-1.5 block text-sm text-dashboard-soft">State of charge</span>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <strong className="block text-[1.25rem] font-semibold text-dashboard-text">{battery.energy} kWh</strong>
              <span className="mt-1 block text-sm text-dashboard-soft">Stored energy</span>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-[20px] border border-white/8 bg-[#0b111d]/88 p-3">
            <BatteryVisual level={battery.socValue} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailCard label="Current behavior" tone={battery.status === 'Charging' ? 'green' : battery.status === 'Discharging' ? 'danger' : 'neutral'}>
            <StatusChip tone={battery.status === 'Charging' ? 'green' : battery.status === 'Discharging' ? 'danger' : 'neutral'}>
              {battery.status}
            </StatusChip>
          </DetailCard>
          <DetailCard label="Power">
            <strong className="text-[1.05rem] font-semibold text-dashboard-text">{battery.power} kW</strong>
          </DetailCard>
          <DetailCard label="Charge rate">
            <strong className="text-[1.05rem] font-semibold text-dashboard-text">{insights.chargeRate} kW</strong>
          </DetailCard>
          <DetailCard label={insights.runtimeLabel}>
            <strong className="text-[1.05rem] font-semibold text-dashboard-text">{insights.runtimeValue}</strong>
          </DetailCard>
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4 rounded-[24px] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading title="Battery history" />
            <MobileDataStateBadge badge={battery.dataState} />
          </div>
          <SegmentedControl active={period} ariaLabel="Battery history period" options={BATTERY_PERIODS} onChange={(value) => onPeriodChange(value as BatteryPeriod)} />
        </div>

        <div className="rounded-[20px] border border-white/8 bg-[#09101a]/72 p-2.5">
          <MobileLineChart color="#60ea5d" labels={history.labels} points={history.points} unit="%" />
        </div>
      </GlassCard>
    </>
  )
}

export function MobileBatteryOptimizerSection({
  optimizer,
  optimizerSection,
  setOptimizerSection,
}: {
  optimizer: BatteryOptimizerState
  optimizerSection: MobileOptimizerSection
  setOptimizerSection: (section: MobileOptimizerSection) => void
}) {
  const optionLabels: Record<MobileOptimizerSection, string> = {
    charts: 'Charts',
    plan: 'Plan',
    status: 'Status',
  }

  return (
    <>
      <OptimizerStateBanner optimizer={optimizer} variant="mobile" />
      <SegmentedControl
        active={optimizerSection}
        ariaLabel="Battery optimizer section"
        optionLabels={optionLabels}
        options={MOBILE_OPTIMIZER_SECTIONS}
        onChange={(value) => setOptimizerSection(value as MobileOptimizerSection)}
      />

      {optimizerSection === 'status' ? (
        <>
          <BatteryOptimizerStatusCard optimizer={optimizer} variant="mobile" />
          <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="mobile" />
          <BatteryOptimizerControlsCard optimizer={optimizer} variant="mobile" />
        </>
      ) : null}

      {optimizerSection === 'plan' ? <BatteryOptimizerPlanTable optimizer={optimizer} planHours={24} variant="mobile" /> : null}
      {optimizerSection === 'charts' ? <BatteryOptimizerCharts optimizer={optimizer} variant="mobile" /> : null}
    </>
  )
}

function DetailCard({
  children,
  label,
  tone = 'neutral',
}: {
  children: ReactNode
  label: string
  tone?: 'danger' | 'green' | 'neutral'
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 px-3 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <div className="mt-2">
        {tone === 'neutral' ? children : <div className={tone === 'green' ? 'text-emerald-300' : 'text-rose-300'}>{children}</div>}
      </div>
    </div>
  )
}
