import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { cn } from '../../../lib/cn'
import {
  BatteryOptimizerCharts,
  BatteryOptimizerControlsCard,
  BatteryOptimizerDecisionSummary,
  BatteryOptimizerPlanTable,
  BatteryOptimizerStatusCard,
  OptimizerStateBanner,
} from '../../battery/BatteryOptimizerSections'
import { BatteryVisual } from '../../shared/BatteryVisual'
import { LineChart } from './DesktopShared'

const PERIODS = ['24h', '7d', '30d', '90d'] as const
type BatteryHistoryPeriod = (typeof PERIODS)[number]
const OPTIMIZER_SECTIONS = ['Status', 'Plan', 'Charts'] as const
type OptimizerSection = (typeof OPTIMIZER_SECTIONS)[number]

type BatteryModel = {
  capacity: string
  energy: string
  power: string
  soc: string
  socValue: number
  status: string
  dataState?: unknown
}

type BatteryHistoryModel = {
  day: { labels: string[]; points: number[] }
  month: { labels: string[]; points: number[] }
  quarter: { labels: string[]; points: number[] }
  week: { labels: string[]; points: number[] }
}

export function BatteryDetailsSection({
  battery,
  batteryHistory,
  period,
  setPeriod,
  timeEstimate,
}: {
  battery: BatteryModel
  batteryHistory: BatteryHistoryModel
  period: BatteryHistoryPeriod
  setPeriod: (period: BatteryHistoryPeriod) => void
  timeEstimate: { label: string; value: string }
}) {
  const activeHistory =
    period === '24h'
      ? batteryHistory.day
      : period === '7d'
        ? batteryHistory.week
        : period === '30d'
          ? batteryHistory.month
          : batteryHistory.quarter

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,0.92fr)_280px] gap-5">
      <section className="flex min-h-0 flex-col gap-5">
        <BatterySummaryCards battery={battery} timeEstimate={timeEstimate} />
        <BatteryHistoryCard activeHistory={activeHistory} period={period} setPeriod={setPeriod} />
      </section>

      <aside className="flex min-h-0 flex-col gap-5">
        <BatteryVisualCard socValue={battery.socValue} />
        <BatteryQuickReadCard battery={battery} timeEstimate={timeEstimate} />
      </aside>
    </div>
  )
}

export function BatteryOptimizerSection({
  optimizer,
  optimizerSection,
  setOptimizerSection,
}: {
  optimizer: BatteryOptimizerState
  optimizerSection: OptimizerSection
  setOptimizerSection: (section: OptimizerSection) => void
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battery optimizer sections">
        {OPTIMIZER_SECTIONS.map((item) => (
          <button
            key={item}
            aria-selected={optimizerSection === item}
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
              optimizerSection === item
                ? 'border-dashboard-blue/45 bg-dashboard-blue/16 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.18)]'
                : 'border-white/10 bg-white/5 text-dashboard-soft hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text',
            )}
            role="tab"
            type="button"
            onClick={() => setOptimizerSection(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {optimizerSection === 'Status' ? (
          <div className="grid h-full gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <BatteryOptimizerStatusCard optimizer={optimizer} variant="desktop" />
              <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="desktop" />
            </div>
            <BatteryOptimizerControlsCard optimizer={optimizer} variant="desktop" />
          </div>
        ) : optimizerSection === 'Plan' ? (
          <BatteryOptimizerPlanTable optimizer={optimizer} planHours={48} variant="desktop" />
        ) : (
          <BatteryOptimizerCharts optimizer={optimizer} variant="desktop" />
        )}
      </div>
    </section>
  )
}

function BatterySummaryCards({
  battery,
  timeEstimate,
}: {
  battery: BatteryModel
  timeEstimate: { label: string; value: string }
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Battery state</span>
        <strong className="mt-3 block text-[2.1rem] font-semibold leading-none text-dashboard-text">{battery.soc}</strong>
        <span className="mt-1.5 block text-sm text-dashboard-soft">State of charge</span>
        <div className="my-4 h-px bg-white/10" />
        <strong className="block text-[1.6rem] font-semibold leading-none text-dashboard-text">{battery.energy} kWh</strong>
        <span className="mt-1.5 block text-sm text-dashboard-soft">Stored energy</span>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Current behavior</span>
        <strong
          className={cn(
            'mt-3 block text-[1.4rem] font-semibold',
            battery.status.toLowerCase() === 'charging'
              ? 'text-emerald-300'
              : battery.status.toLowerCase() === 'discharging'
                ? 'text-rose-300'
                : 'text-dashboard-text',
          )}
        >
          {battery.status}
        </strong>
        <strong className="mt-3 block text-[1.8rem] font-semibold leading-none text-dashboard-text">{battery.power} kW</strong>
        <span className="mt-1.5 block text-sm text-dashboard-soft">{timeEstimate.label}</span>
        <div className="my-4 h-px bg-white/10" />
        <strong className="block text-[1.25rem] font-semibold leading-none text-dashboard-text">{timeEstimate.value}</strong>
      </div>
    </div>
  )
}

function BatteryHistoryCard({
  activeHistory,
  period,
  setPeriod,
}: {
  activeHistory: { labels: string[]; points: number[] }
  period: BatteryHistoryPeriod
  setPeriod: (period: BatteryHistoryPeriod) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-dashboard-text">Battery % over time</h2>
          <p className="text-sm text-dashboard-soft">State of charge history for the selected window.</p>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battery history period">
          {PERIODS.map((item) => (
            <button
              key={item}
              aria-selected={period === item}
              className={cn(
                'inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
                period === item
                  ? 'border-dashboard-blue/45 bg-dashboard-blue/16 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.18)]'
                  : 'border-white/10 bg-white/5 text-dashboard-soft hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text',
              )}
              role="tab"
              type="button"
              onClick={() => setPeriod(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <LineChart
        className="insight-line-chart min-h-[240px] flex-1 rounded-[20px] border border-white/8 bg-[#0b111d]/88 p-4"
        color="#60ea5d"
        label="Battery percentage over time"
        labels={activeHistory.labels}
        points={activeHistory.points}
        unit="%"
      />

      <div className="mt-3 flex items-start gap-3 rounded-[20px] border border-white/8 bg-[#0b111d]/88 px-4 py-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-dashboard-text">
          i
        </span>
        <p className="text-sm leading-5 text-dashboard-soft">
          The graph shows the battery state of charge over the selected time period.
        </p>
      </div>
    </div>
  )
}

function BatteryVisualCard({ socValue }: { socValue: number }) {
  return (
    <div className="flex min-h-[250px] items-center justify-center rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <BatteryVisual level={socValue} size="modal" />
    </div>
  )
}

function BatteryQuickReadCard({
  battery,
  timeEstimate,
}: {
  battery: BatteryModel
  timeEstimate: { label: string; value: string }
}) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div>
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Quick read</span>
        <strong className="mt-3 block text-[1.4rem] font-semibold text-dashboard-text">
          {battery.status === 'Charging' || battery.status === 'Discharging' ? `${battery.status} now` : 'Battery steady'}
        </strong>
      </div>
      <div className="grid gap-3">
        <QuickDetail label="State of charge" value={battery.soc} />
        <QuickDetail label="Stored energy" value={`${battery.energy} kWh`} />
        <QuickDetail label="Power" value={`${battery.power} kW`} />
        <QuickDetail label={timeEstimate.label} value={timeEstimate.value} />
      </div>
    </div>
  )
}

function QuickDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 px-3.5 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <strong className="mt-1.5 block text-[0.98rem] font-semibold text-dashboard-text">{value}</strong>
    </div>
  )
}
