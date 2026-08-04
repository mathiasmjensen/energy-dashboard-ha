import { useState } from 'react'
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

const MOBILE_DETAILS_SECTIONS = ['Battery', 'Full plan', 'Controls'] as const
type MobileDetailsSection = (typeof MOBILE_DETAILS_SECTIONS)[number]

export function MobileBatteryDetailsSection({
  battery,
  history,
  historyError,
  historySource,
  insights,
  period,
  onPeriodChange,
}: {
  battery: MobileDashboardProps['battery']
  history: { labels: string[]; points: number[] }
  historyError: string | null
  historySource: 'ha' | 'unavailable'
  insights: {
    chargeRate: string
    dischargeRate: string
    runtimeLabel: string
    runtimeValue: string
  }
  period: BatteryPeriod
  onPeriodChange: (period: BatteryPeriod) => void
}) {
  const hasHistory = history.points.length > 0

  return (
    <>
      <GlassCard className="grid gap-4 rounded-[26px] p-4">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading title="Battery status" />
          <MobileDataStateBadge badge={battery.dataState} />
        </div>

        <div className="grid grid-cols-[1fr_108px] gap-4">
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

          <div className="flex items-center justify-center rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-2.5">
            <BatteryVisual level={battery.socValue} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
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
          {hasHistory ? (
            <MobileLineChart color="#60ea5d" labels={history.labels} points={history.points} unit="%" />
          ) : (
            <div className="flex min-h-[156px] flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] px-5 text-center">
              <strong className="text-[14px] font-semibold text-dashboard-text">No battery history yet</strong>
              <p className="text-[12px] leading-5 text-dashboard-soft">
                {historyError ?? 'Recorder history for the battery state-of-charge sensor is not available yet.'}
              </p>
              <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                {historySource === 'ha' ? 'Live' : 'History unavailable'}
              </span>
            </div>
          )}
        </div>
      </GlassCard>
    </>
  )
}

export function MobileBatteryPlannerDashboard({
  optimizer,
  onOpenDetails,
}: {
  optimizer: BatteryOptimizerState
  onOpenDetails: () => void
}) {
  return (
    <>
      <OptimizerStateBanner optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerStatusCard optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="mobile" />
      <BatteryOptimizerCharts optimizer={optimizer} variant="mobile" />
      <GlassCard className="dashboard-glass-card flex items-center justify-between gap-4 rounded-panel p-4">
        <div>
          <strong className="block text-[15px] font-semibold text-dashboard-text">Open the full plan</strong>
          <span className="mt-1 block text-[12px] leading-5 text-dashboard-soft">See every hour, adjust controls, and apply the optimizer.</span>
        </div>
        <button className="shrink-0 rounded-xl bg-dashboard-blue px-3 py-2 text-sm font-semibold text-white" type="button" onClick={onOpenDetails}>
          Details
        </button>
      </GlassCard>
    </>
  )
}

export function MobileBatteryDetailsWorkspace({
  battery,
  history,
  historyError,
  historySource,
  insights,
  optimizer,
  period,
  onPeriodChange,
}: {
  battery: MobileDashboardProps['battery']
  history: { labels: string[]; points: number[] }
  historyError: string | null
  historySource: 'ha' | 'unavailable'
  insights: { chargeRate: string; dischargeRate: string; runtimeLabel: string; runtimeValue: string }
  optimizer: BatteryOptimizerState
  period: BatteryPeriod
  onPeriodChange: (period: BatteryPeriod) => void
}) {
  const [section, setSection] = useState<MobileDetailsSection>('Battery')
  const labels: Record<MobileDetailsSection, string> = { Battery: 'Battery', 'Full plan': 'Plan', Controls: 'Controls' }

  return (
    <>
      <SegmentedControl
        active={section}
        ariaLabel="Battery detail sections"
        optionLabels={labels}
        options={MOBILE_DETAILS_SECTIONS}
        onChange={(value) => setSection(value as MobileDetailsSection)}
      />
      {section === 'Battery' ? (
        <MobileBatteryDetailsSection
          battery={battery}
          history={history}
          historyError={historyError}
          historySource={historySource}
          insights={insights}
          period={period}
          onPeriodChange={onPeriodChange}
        />
      ) : section === 'Full plan' ? (
        <>
          <OptimizerStateBanner optimizer={optimizer} variant="mobile" />
          <BatteryOptimizerPlanTable optimizer={optimizer} planHours={24} variant="mobile" />
        </>
      ) : (
        <>
          <OptimizerStateBanner optimizer={optimizer} variant="mobile" />
          <BatteryOptimizerStatusCard optimizer={optimizer} variant="mobile" />
          <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="mobile" />
          <BatteryOptimizerControlsCard optimizer={optimizer} variant="mobile" />
        </>
      )}
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
    <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <div className="mt-2">
        {tone === 'neutral' ? children : <div className={tone === 'green' ? 'text-emerald-300' : 'text-rose-300'}>{children}</div>}
      </div>
    </div>
  )
}
