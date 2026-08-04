import { useState } from 'react'
import type { ReactNode } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { cn } from '../../../lib/cn'
import {
  BatteryOptimizerPlanTable,
  OptimizerStateBanner,
} from '../../battery/BatteryOptimizerSections'
import { BatteryVisual } from '../../shared/BatteryVisual'
import { BarChart, LineChart, OverviewIcon } from './DesktopShared'
import {
  formatOptimizerHourRange,
  formatOptimizerPrice,
  formatOptimizerUpdatedAt,
  getOptimizerModeLabel,
} from '../../../services/batteryOptimizerFormatting'

const PERIODS = ['24h', '7d', '30d', '90d'] as const
type BatteryHistoryPeriod = (typeof PERIODS)[number]
const DETAILS_SECTIONS = ['Battery', 'Full plan'] as const
type DetailsSection = (typeof DETAILS_SECTIONS)[number]

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
  error: string | null
  month: { labels: string[]; points: number[] }
  quarter: { labels: string[]; points: number[] }
  source: 'ha' | 'unavailable'
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
        <BatteryHistoryCard
          activeHistory={activeHistory}
          historyError={batteryHistory.error}
          historySource={batteryHistory.source}
          period={period}
          setPeriod={setPeriod}
        />
      </section>

      <aside className="flex min-h-0 flex-col gap-5">
        <BatteryVisualCard socValue={battery.socValue} />
        <BatteryQuickReadCard battery={battery} timeEstimate={timeEstimate} />
      </aside>
    </div>
  )
}

export function BatteryPlannerDashboard({
  battery,
  batteryHistory,
  distribution,
  flow,
  optimizer,
  onOpenDetails,
}: {
  battery: BatteryModel
  batteryHistory: BatteryHistoryModel
  distribution: { batteryCharge: string; batteryDischarge: string; gridExport: string; gridImport: string }
  flow: { evPower: string; evStatus: string; gridPower: string; gridStatus: string; homePower: string; solarPower: string }
  optimizer: BatteryOptimizerState
  onOpenDetails: () => void
}) {
  const snapshot = optimizer.snapshot
  const status = snapshot?.status
  const nextAction = snapshot?.planRows[0]
  const history = batteryHistory.day

  return (
    <section className="grid gap-4 pb-2">
      <div className="grid gap-3 xl:grid-cols-3">
        <BatteryHeroMetric label="State of charge" meta={battery.energy ? `${battery.energy} kWh stored` : undefined} tone="green" value={battery.soc}>
          <BatteryVisual level={battery.socValue} />
        </BatteryHeroMetric>
        <BatteryHeroMetric label="Battery power" meta={battery.status} tone={battery.status === 'Discharging' ? 'violet' : 'green'} value={`${battery.power} kW`} />
        <BatteryHeroMetric label="Stored energy" meta={battery.capacity ? `Usable capacity ${battery.capacity} kWh` : undefined} tone="blue" value={`${battery.energy} kWh`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(250px,0.8fr)_minmax(460px,1.5fr)_minmax(250px,0.8fr)]">
        <BatteryFlowCard battery={battery} flow={flow} />
        <BatteryOutlookCard optimizer={optimizer} />
        <BatteryActionsCard nextAction={nextAction} optimizer={optimizer} onOpenDetails={onOpenDetails} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(320px,1fr)_minmax(0,1.45fr)]">
        <EnergySummaryCard distribution={distribution} />
        <PriceDecisionCard optimizer={optimizer} />
        {history.points.length ? <BatteryHistoryMiniCard history={history} status={status?.recommendation} /> : <BatteryEconomicsCard optimizer={optimizer} />}
      </div>
    </section>
  )
}

export function BatteryDetailsWorkspace({
  battery,
  batteryHistory,
  optimizer,
  period,
  setPeriod,
  timeEstimate,
}: {
  battery: BatteryModel
  batteryHistory: BatteryHistoryModel
  optimizer: BatteryOptimizerState
  period: BatteryHistoryPeriod
  setPeriod: (period: BatteryHistoryPeriod) => void
  timeEstimate: { label: string; value: string }
}) {
  const [section, setSection] = useState<DetailsSection>('Battery')

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battery detail sections">
        {DETAILS_SECTIONS.map((item) => (
          <button
            key={item}
            aria-selected={section === item}
            className={cn(
              'inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
              section === item
                ? 'border-dashboard-blue/45 bg-dashboard-blue/16 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.18)]'
                : 'border-white/10 bg-white/5 text-dashboard-soft hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text',
            )}
            role="tab"
            type="button"
            onClick={() => setSection(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {section === 'Battery' ? (
        <BatteryDetailsSection
          battery={battery}
          batteryHistory={batteryHistory}
          period={period}
          setPeriod={setPeriod}
          timeEstimate={timeEstimate}
        />
      ) : section === 'Full plan' ? (
        <>
          <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
          <BatteryOptimizerPlanTable optimizer={optimizer} planHours={48} variant="desktop" />
        </>
      ) : null}
    </section>
  )
}

function BatteryHeroMetric({ children, label, meta, tone, value }: { children?: ReactNode; label: string; meta?: string; tone: 'blue' | 'green' | 'violet'; value: string }) {
  return (
    <section className={cn('min-h-[126px] rounded-[18px] border bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]', tone === 'green' ? 'border-dashboard-green/35' : tone === 'violet' ? 'border-dashboard-purple/30' : 'border-dashboard-blue/30')}>
      <div className="flex h-full items-center justify-between gap-3">
        <div>
          <span className="text-sm text-dashboard-soft">{label}</span>
          <strong className="mt-2 block text-[1.65rem] font-semibold leading-none text-white">{value}</strong>
          {meta ? <span className="mt-2 block text-sm text-dashboard-soft">{meta}</span> : null}
        </div>
        {children ?? <MetricPulseGlyph tone={tone} />}
      </div>
    </section>
  )
}

function BatteryFlowCard({ battery, flow }: { battery: BatteryModel; flow: { evPower: string; evStatus: string; gridPower: string; gridStatus: string; homePower: string; solarPower: string } }) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_50%_34%,rgba(43,132,99,0.12),transparent_42%),#101925] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex items-center gap-2"><h2 className="text-base font-semibold text-white">Battery flow</h2><span className="rounded-full bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>
      <div className="relative h-[284px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 280" aria-hidden="true">
          <path d="M112 66H150Q164 66 164 104" fill="none" stroke="rgba(245,166,35,0.9)" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="3" />
          <path d="M248 66H210Q196 66 196 104" fill="none" stroke="rgba(61,134,255,0.8)" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="3" />
          <path d="M112 220H150Q164 220 164 186" fill="none" stroke="rgba(166,77,245,0.82)" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="3" />
          <path d="M248 220H210Q196 220 196 186" fill="none" stroke="rgba(166,173,182,0.7)" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="3" />
          <path d="M180 100V80" stroke="rgba(96,234,93,0.9)" strokeLinecap="round" strokeWidth="3" />
          <path d="M180 200V218" stroke="rgba(96,234,93,0.9)" strokeLinecap="round" strokeWidth="3" />
        </svg>
        <div className="absolute left-0 top-1 w-[112px]"><FlowRead icon="solar" label="Solar" tone="sun" value={`${flow.solarPower} kW`} /></div>
        <div className="absolute right-0 top-1 w-[112px]"><FlowRead icon="home" label="Home" tone="blue" value={`${flow.homePower} kW`} /></div>
        <div className="absolute left-0 bottom-0 w-[112px]"><FlowRead icon="grid" label="Grid" meta={flow.gridStatus} tone="purple" value={`${flow.gridPower} kW`} /></div>
        <div className="absolute right-0 bottom-0 w-[112px]"><FlowRead icon="car" label="EV charger" meta={flow.evStatus} tone="muted" value={`${flow.evPower} kW`} /></div>
        <div className="absolute left-1/2 top-1/2 flex h-[128px] w-[94px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[22px] border border-dashboard-green/35 bg-[#0b1717]/95 shadow-[0_0_30px_rgba(96,234,93,0.12)]">
          <BatteryVisual level={battery.socValue} />
          <strong className="mt-1 text-[1.1rem] leading-none text-white">{battery.soc}</strong>
          <span className="mt-1 text-xs text-dashboard-green">{battery.status}</span>
          <strong className="mt-1 text-sm text-white">{battery.power} kW</strong>
        </div>
      </div>
    </section>
  )
}

function BatteryOutlookCard({ optimizer }: { optimizer: BatteryOptimizerState }) {
  const snapshot = optimizer.snapshot
  if (!snapshot) return <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
  const { charts, status } = snapshot
  return (
    <section className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,34,45,0.96),rgba(12,20,29,0.96))] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-white">Optimization outlook</h2><p className="mt-1 text-sm text-dashboard-soft">Battery target and predicted state of charge</p></div><span className="rounded-full bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
        <MiniRead label="Strategy" value={getOptimizerModeLabel(status.mode)} />
        <MiniRead label="Target SoC" value={`${Math.round(snapshot.planRows[0]?.targetSocPercent ?? status.socPercent)}%`} />
        <MiniRead label="Recommendation" value={status.recommendation} />
      </div>
      <LineChart className="insight-line-chart mt-3 h-[178px]" color="#60ea5d" label="Battery state of charge forecast" labels={charts.socForecast.labels} points={charts.socForecast.points} unit="%" />
      <div className="mt-2 flex items-center gap-4 text-[11px] text-dashboard-soft"><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-dashboard-green" />Predicted SoC</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-dashboard-purple" />Charge window</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-white/60" />Target</span></div>
    </section>
  )
}

function BatteryActionsCard({ nextAction, optimizer, onOpenDetails }: { nextAction: import('../../../models/batteryOptimizer').BatteryOptimizerPlanRow | undefined; optimizer: BatteryOptimizerState; onOpenDetails: () => void }) {
  const status = optimizer.snapshot?.status
  return (
    <section className="rounded-[18px] border border-white/10 bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]">
      <h2 className="text-base font-semibold text-white">Optimizer actions</h2>
      <div className="mt-3 grid divide-y divide-white/10 rounded-[14px] border border-white/8 bg-[#0a111b]/70 px-3">
        <ActionRead label="Current action" value={status?.recommendation ?? 'Waiting'} />
        <ActionRead label="Next action" value={nextAction ? `${nextAction.action} · ${formatOptimizerHourRange(nextAction)}` : 'No plan yet'} />
        <ActionRead label="Buy price" value={formatOptimizerPrice(status?.fullBuyPriceDkkPerKwh)} />
        <ActionRead label="Export payout" value={formatOptimizerPrice(status?.sellPriceDkkPerKwh)} />
        <ActionRead label="Updated" value={formatOptimizerUpdatedAt(status?.updatedAt)} />
      </div>
      <button className="mt-3 w-full rounded-xl border border-dashboard-blue/35 bg-dashboard-blue/10 px-3 py-2.5 text-sm font-semibold text-dashboard-text transition hover:bg-dashboard-blue/20" type="button" onClick={onOpenDetails}>View full plan</button>
    </section>
  )
}

function EnergySummaryCard({ distribution }: { distribution: { batteryCharge: string; batteryDischarge: string; gridExport: string; gridImport: string } }) {
  return <section className="rounded-[18px] border border-white/10 bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]"><h2 className="text-base font-semibold text-white">Energy summary <span className="ml-1 text-xs font-medium text-dashboard-soft">Today</span></h2><div className="mt-3 grid gap-2"><ActionRead label="Charged" value={`${distribution.batteryCharge} kWh`} /><ActionRead label="Discharged" value={`${distribution.batteryDischarge} kWh`} /><ActionRead label="Import from grid" value={`${distribution.gridImport} kWh`} /><ActionRead label="Export to grid" value={`${distribution.gridExport} kWh`} /></div></section>
}

function PriceDecisionCard({ optimizer }: { optimizer: BatteryOptimizerState }) {
  const charts = optimizer.snapshot?.charts
  return <section className="rounded-[18px] border border-white/10 bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-white">Price optimization</h2><span className="rounded-full bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>{charts ? <BarChart className="insight-bar-chart insight-bar-chart--prices mt-4 h-[135px]" label="Buy price forecast" labels={charts.priceCurve.labels} unit="DKK/kWh" values={charts.priceCurve.points} /> : <p className="mt-8 text-sm text-dashboard-soft">Waiting for price data.</p>}</section>
}

function BatteryHistoryMiniCard({ history, status }: { history: { labels: string[]; points: number[] }; status: string | undefined }) {
  return <section className="rounded-[18px] border border-white/10 bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-white">Battery history</h2><span className="text-xs text-dashboard-soft">24 hours</span></div><LineChart className="insight-line-chart mt-3 h-[135px]" color="#60ea5d" label="Battery state of charge history" labels={history.labels} points={history.points} unit="%" />{status ? <span className="mt-2 block text-xs text-dashboard-soft">Current optimizer recommendation: <strong className="text-dashboard-text">{status}</strong></span> : null}</section>
}

function BatteryEconomicsCard({ optimizer }: { optimizer: BatteryOptimizerState }) {
  const status = optimizer.snapshot?.status
  return <section className="rounded-[18px] border border-white/10 bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]"><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-white">Battery economics</h2><span className="rounded-full bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div><div className="mt-4 grid grid-cols-2 gap-3"><EconomicRead label="Spot price" value={formatOptimizerPrice(status?.spotPriceDkkPerKwh)} /><EconomicRead label="Buy price" value={formatOptimizerPrice(status?.fullBuyPriceDkkPerKwh)} /><EconomicRead label="Export payout" value={formatOptimizerPrice(status?.sellPriceDkkPerKwh)} /><EconomicRead label="Estimated today" value={status ? `${status.estimatedProfitTodayDkk.toFixed(2)} DKK` : '---'} /></div><span className="mt-4 block text-xs leading-5 text-dashboard-soft">Values use the latest optimizer price snapshot and export payout.</span></section>
}

function MetricPulseGlyph({ tone }: { tone: 'blue' | 'green' | 'violet' }) { return <svg className={cn('h-12 w-16', tone === 'green' ? 'text-dashboard-green' : tone === 'violet' ? 'text-dashboard-purple' : 'text-dashboard-blue')} fill="none" viewBox="0 0 64 44"><path d="M2 27h10l5-15 7 25 8-31 7 21h7l4-10 5 10h7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></svg> }
function EconomicRead({ label, value }: { label: string; value: string }) { return <div className="rounded-[13px] border border-white/8 bg-[#09111b]/72 px-3 py-2.5"><span className="block text-[10px] uppercase tracking-[0.1em] text-dashboard-muted">{label}</span><strong className="mt-1 block text-sm text-white">{value}</strong></div> }
function FlowRead({ icon, label, meta, tone, value }: { icon: 'car' | 'grid' | 'home' | 'solar'; label: string; meta?: string; tone: 'blue' | 'muted' | 'purple' | 'sun'; value: string }) { return <div className="rounded-[13px] border border-white/10 bg-[#0b121c]/95 px-2.5 py-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.22)]"><span className={cn('flex items-center gap-1.5 text-xs', tone === 'sun' ? 'text-dashboard-orange' : tone === 'purple' ? 'text-dashboard-purple' : tone === 'blue' ? 'text-dashboard-blue' : 'text-dashboard-soft')}><OverviewIcon name={icon} />{label}</span><strong className="mt-1.5 block text-sm text-white">{value}</strong>{meta ? <span className="mt-1 block truncate text-[10px] text-dashboard-soft">{meta}</span> : null}</div> }
function MiniRead({ label, value }: { label: string; value: string }) { return <div><span className="block text-[10px] uppercase tracking-[0.1em] text-dashboard-muted">{label}</span><strong className="mt-1 block truncate text-sm text-dashboard-text">{value}</strong></div> }
function ActionRead({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 py-2"><span className="text-xs text-dashboard-soft">{label}</span><strong className="max-w-[62%] text-right text-sm font-semibold text-dashboard-text">{value}</strong></div> }

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
  historyError,
  historySource,
  period,
  setPeriod,
}: {
  activeHistory: { labels: string[]; points: number[] }
  historyError: string | null
  historySource: 'ha' | 'unavailable'
  period: BatteryHistoryPeriod
  setPeriod: (period: BatteryHistoryPeriod) => void
}) {
  const hasHistory = activeHistory.points.length > 0

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

      <div className="relative min-h-[240px] flex-1 rounded-[20px] border border-white/8 bg-[#0b111d]/88 p-4">
        {hasHistory ? (
          <LineChart
            className="insight-line-chart h-full w-full"
            color="#60ea5d"
            label="Battery percentage over time"
            labels={activeHistory.labels}
            points={activeHistory.points}
            unit="%"
          />
        ) : (
          <div className="flex h-full min-h-[208px] flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
            <strong className="text-[15px] font-semibold text-dashboard-text">No battery history yet</strong>
            <p className="max-w-[28rem] text-sm leading-6 text-dashboard-soft">
              {historyError ?? 'Recorder history for the battery state-of-charge sensor is not available yet.'}
            </p>
            <span className="inline-flex rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100">
              {historySource === 'ha' ? 'Live' : 'History unavailable'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-[20px] border border-white/8 bg-[#0b111d]/88 px-4 py-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-dashboard-text">
          i
        </span>
        <p className="text-sm leading-5 text-dashboard-soft">
          {hasHistory
            ? 'The graph shows the battery state of charge over the selected time period.'
            : 'Once Home Assistant recorder has battery SoC history, this chart will switch over automatically.'}
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
