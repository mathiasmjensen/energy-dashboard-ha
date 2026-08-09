import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { cn } from '../../../lib/cn'
import {
  BatteryOptimizerPlanTable,
  OptimizerStateBanner,
} from '../../battery/BatteryOptimizerSections'
import { BatteryVisual } from '../../shared/BatteryVisual'
import { LineChart, OverviewIcon } from './DesktopShared'
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
  const targetSoc = snapshot?.planRows[0]?.targetSocPercent ?? status?.socPercent

  return (
    <section className="grid w-full gap-4 pb-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <BatteryHeroMetric compact label="State of charge" meta={battery.energy ? `${battery.energy} kWh stored` : undefined} tone="green" value={battery.soc}>
          <BatteryVisual className="!h-[78px] !w-[46px]" level={battery.socValue} />
        </BatteryHeroMetric>
        <BatteryHeroMetric compact label="Battery power" meta={battery.status} tone={battery.status === 'Discharging' ? 'violet' : 'green'} value={`${battery.power} kW`} />
        <BatteryHeroMetric compact label="Stored energy" meta={battery.capacity ? `Usable ${battery.capacity} kWh` : undefined} tone="blue" value={`${battery.energy} kWh`} />
        <BatteryHeroMetric compact label="Next action" meta={nextAction ? formatOptimizerHourRange(nextAction) : 'No plan window'} tone="violet" value={nextAction?.action ?? 'HOLD'} />
        <BatteryHeroMetric compact label="Battery target" meta="Next planned target" tone="green" value={targetSoc === undefined ? '---' : `${Math.round(targetSoc)}%`} />
        <BatteryHeroMetric compact label="Buy price" meta="Full price / kWh" tone="blue" value={shortPrice(status?.fullBuyPriceDkkPerKwh)} />
        <BatteryHeroMetric compact label="Export payout" meta="After export costs" tone="green" value={shortPrice(status?.sellPriceDkkPerKwh)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.9fr)_minmax(500px,1.45fr)_minmax(300px,0.72fr)]">
        <BatteryFlowCard battery={battery} flow={flow} />
        <BatteryOutlookCard optimizer={optimizer} />
        <BatteryActionsCard nextAction={nextAction} optimizer={optimizer} onOpenDetails={onOpenDetails} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(240px,0.76fr)_minmax(310px,1fr)_minmax(280px,0.92fr)_minmax(390px,1.32fr)]">
        <EnergySummaryCard distribution={distribution} />
        <PriceDecisionCard optimizer={optimizer} />
        <BatteryUsageCard distribution={distribution} />
        {history.points.length ? <BatteryHistoryMiniCard history={history} status={status?.recommendation} /> : <BatteryEconomicsCard optimizer={optimizer} />}
      </div>
      {status?.updatedAt ? <p className="px-1 text-[11px] text-dashboard-muted">Last optimized {formatOptimizerUpdatedAt(status.updatedAt)}. Decisions use the current price feed, solar forecast, and battery target.</p> : null}
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

function BatteryHeroMetric({ children, compact = false, label, meta, tone, value }: { children?: ReactNode; compact?: boolean; label: string; meta?: string; tone: 'blue' | 'green' | 'violet'; value: string }) {
  return (
    <section className={cn('relative h-[128px] min-h-0 overflow-hidden rounded-[16px] border bg-[linear-gradient(145deg,rgba(24,35,49,0.96),rgba(11,17,27,0.98))] p-4 shadow-[0_16px_38px_rgba(0,0,0,0.28)]', tone === 'green' ? 'border-dashboard-green/30' : tone === 'violet' ? 'border-dashboard-purple/30' : 'border-dashboard-blue/30')}>
      <span className={cn('absolute left-0 top-0 h-[2px] w-2/3', tone === 'green' ? 'bg-dashboard-green/70' : tone === 'violet' ? 'bg-dashboard-purple/70' : 'bg-dashboard-blue/70')} />
      <div className="flex h-full items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-dashboard-soft">{label}</span>
          <strong className={cn('mt-2 block font-semibold leading-none text-white', compact ? 'text-[1.35rem]' : 'text-[1.65rem]')}>{value}</strong>
          {meta ? <span className="mt-2 block text-[11px] text-dashboard-soft">{meta}</span> : null}
        </div>
        <div className="shrink-0 opacity-90">{children ?? <MetricPulseGlyph tone={tone} />}</div>
      </div>
    </section>
  )
}

function BatteryFlowCard({ battery, flow }: { battery: BatteryModel; flow: { evPower: string; evStatus: string; gridPower: string; gridStatus: string; homePower: string; solarPower: string } }) {
  return (
    <section className="min-h-[379px] rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_50%_52%,rgba(71,202,119,0.13),transparent_31%),linear-gradient(145deg,#152334,#0c131f_74%)] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      <div className="mb-2 flex items-center justify-between gap-2"><div><h2 className="text-base font-semibold text-white">Battery flow</h2><p className="mt-1 text-xs text-dashboard-soft">Live energy routing</p></div><span className="rounded-full border border-dashboard-green/20 bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>
      <div className="relative h-[293px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 420 260" aria-hidden="true">
          <defs>
            <filter id="battery-flow-glow"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <path d="M120 54 C164 54 164 86 184 104" fill="none" stroke="rgba(245,166,35,0.2)" strokeWidth="7" />
          <path d="M120 54 C164 54 164 86 184 104" className="desktop-battery-flow-pulse" fill="none" stroke="#f5a623" strokeDasharray="5 17" strokeLinecap="round" strokeWidth="3" filter="url(#battery-flow-glow)" />
          <path d="M300 54 C258 54 258 86 238 104" fill="none" stroke="rgba(65,160,255,0.2)" strokeWidth="7" />
          <path d="M300 54 C258 54 258 86 238 104" className="desktop-battery-flow-pulse desktop-battery-flow-pulse--reverse" fill="none" stroke="#5a9cff" strokeDasharray="5 17" strokeLinecap="round" strokeWidth="3" filter="url(#battery-flow-glow)" />
          <path d="M120 204 C164 204 164 174 184 156" fill="none" stroke="rgba(173,86,255,0.2)" strokeWidth="7" />
          <path d="M120 204 C164 204 164 174 184 156" className="desktop-battery-flow-pulse" fill="none" stroke="#a75cff" strokeDasharray="5 17" strokeLinecap="round" strokeWidth="3" filter="url(#battery-flow-glow)" />
          <path d="M300 204 C258 204 258 174 238 156" fill="none" stroke="rgba(201,210,222,0.16)" strokeWidth="7" />
          <path d="M300 204 C258 204 258 174 238 156" className="desktop-battery-flow-pulse desktop-battery-flow-pulse--reverse" fill="none" stroke="#c5cedb" strokeDasharray="5 17" strokeLinecap="round" strokeWidth="3" filter="url(#battery-flow-glow)" />
        </svg>
        <div className="absolute left-0 top-2 w-[120px]"><FlowRead icon="solar" label="Solar" tone="sun" value={`${flow.solarPower} kW`} /></div>
        <div className="absolute right-0 top-2 w-[120px]"><FlowRead icon="home" label="Home" tone="blue" value={`${flow.homePower} kW`} /></div>
        <div className="absolute bottom-0 left-0 w-[120px]"><FlowRead icon="grid" label="Grid" meta={flow.gridStatus} tone="purple" value={`${flow.gridPower} kW`} /></div>
        <div className="absolute bottom-0 right-0 w-[120px]"><FlowRead icon="car" label="EV charger" meta={flow.evStatus} tone="muted" value={`${flow.evPower} kW`} /></div>
        <div className="absolute left-1/2 top-1/2 flex h-[124px] w-[110px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[26px] border border-dashboard-green/40 bg-[#0c1a1b]/95 shadow-[0_0_42px_rgba(96,234,93,0.18)]">
          <span className="absolute -top-3 rounded-full border border-dashboard-green/35 bg-[#132425] px-2 py-0.5 text-[9px] font-bold tracking-[0.11em] text-dashboard-green">BATTERY</span>
          <BatteryVisual level={battery.socValue} />
          <strong className="mt-1 text-[1.2rem] leading-none text-white">{battery.soc}</strong>
          <span className="mt-1 text-[11px] text-dashboard-green">{battery.status}</span>
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
  const scheduledTargets = snapshot.planRows
    .filter((row) => Number.isFinite(row.targetSocPercent))
    .map((row) => ({ label: new Date(row.startIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), point: row.targetSocPercent }))
  const hasForecast = charts.socForecast.points.length > 1
  const scheduleLabels = hasForecast ? charts.socForecast.labels : scheduledTargets.map((item) => item.label)
  const schedulePoints = hasForecast ? charts.socForecast.points : scheduledTargets.map((item) => item.point)
  return (
    <section className="min-h-[379px] rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,39,53,0.96),rgba(12,19,29,0.98))] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-white">Optimization schedule</h2><p className="mt-1 text-xs text-dashboard-soft">Predicted state of charge</p></div><span className="rounded-full border border-dashboard-green/20 bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
        <MiniRead label="Strategy" value={getOptimizerModeLabel(status.mode)} />
        <MiniRead label="Target SoC" value={`${Math.round(snapshot.planRows[0]?.targetSocPercent ?? status.socPercent)}%`} />
        <MiniRead label="Recommendation" value={status.recommendation} />
      </div>
      <div className="relative mt-3 border-b border-white/10 pb-2">
        {schedulePoints.length > 1 ? (
          <BatteryScheduleChart labels={scheduleLabels} points={schedulePoints} target={Math.round(snapshot.planRows[0]?.targetSocPercent ?? status.socPercent)} />
        ) : (
          <div className="flex h-[196px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 px-6 text-center text-xs leading-5 text-dashboard-soft">No battery target series has been supplied yet. The next optimization refresh will populate this schedule.</div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-dashboard-soft"><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-dashboard-green" />Predicted SoC</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-dashboard-purple" />Charge</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-white/60" />Target</span></div>
    </section>
  )
}

function BatteryActionsCard({ nextAction, optimizer, onOpenDetails }: { nextAction: import('../../../models/batteryOptimizer').BatteryOptimizerPlanRow | undefined; optimizer: BatteryOptimizerState; onOpenDetails: () => void }) {
  const status = optimizer.snapshot?.status
  return (
    <section className="min-h-[379px] rounded-[18px] border border-white/10 bg-[linear-gradient(145deg,#152131,#0c141f)] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-2"><h2 className="text-base font-semibold text-white">Optimization actions</h2><span className="rounded-full border border-dashboard-blue/25 bg-dashboard-blue/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-blue">AUTO</span></div>
      <div className="mt-3 grid divide-y divide-white/10 rounded-[14px] border border-white/8 bg-[#0a111b]/70 px-3">
        <ActionRead label="Current action" value={status?.recommendation ?? 'Waiting'} />
        <ActionRead label="Next action" value={nextAction ? `${nextAction.action} · ${formatOptimizerHourRange(nextAction)}` : 'No plan yet'} />
        <ActionRead label="Buy price" value={formatOptimizerPrice(status?.fullBuyPriceDkkPerKwh)} />
        <ActionRead label="Export payout" value={formatOptimizerPrice(status?.sellPriceDkkPerKwh)} />
        <ActionRead label="Updated" value={formatOptimizerUpdatedAt(status?.updatedAt)} />
      </div>
      <button className="mt-4 w-full rounded-xl border border-dashboard-green/35 bg-dashboard-green/15 px-3 py-3 text-sm font-semibold text-dashboard-green transition hover:bg-dashboard-green/25" type="button" onClick={onOpenDetails}>View full optimization</button>
    </section>
  )
}

function EnergySummaryCard({ distribution }: { distribution: { batteryCharge: string; batteryDischarge: string; gridExport: string; gridImport: string } }) {
  return <section className="h-[270px] rounded-[18px] border border-white/10 bg-[#101925]/86 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]"><h2 className="text-base font-semibold text-white">Energy summary <span className="ml-1 text-xs font-medium text-dashboard-soft">Today</span></h2><div className="mt-3 grid gap-2"><ActionRead label="Charged" value={`${distribution.batteryCharge} kWh`} /><ActionRead label="Discharged" value={`${distribution.batteryDischarge} kWh`} /><ActionRead label="Import from grid" value={`${distribution.gridImport} kWh`} /><ActionRead label="Export to grid" value={`${distribution.gridExport} kWh`} /></div></section>
}

function PriceDecisionCard({ optimizer }: { optimizer: BatteryOptimizerState }) {
  const snapshot = optimizer.snapshot
  const status = snapshot?.status
  const summary = snapshot?.decisionSummary
  const bestBuy = describeWindow(summary?.bestBuyHours)
  const bestSell = describeWindow(summary?.bestSellHours)

  return (
    <section className="h-[270px] rounded-[18px] border border-white/10 bg-[linear-gradient(145deg,#132334,#0b141e)] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-white">Price optimization</h2><span className="rounded-full bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PriceWindow accent="purple" icon="zap" label="Best charge window" price={formatOptimizerPrice(status?.fullBuyPriceDkkPerKwh)} time={bestBuy} />
        <PriceWindow accent="sun" icon="sun" label="Best discharge window" price={formatOptimizerPrice(status?.sellPriceDkkPerKwh)} time={bestSell} />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-[12px] border border-white/8 bg-[#0a121c]/82 px-3 py-2.5">
        <div><span className="block text-[10px] text-dashboard-soft">Today&apos;s potential</span><strong className="mt-1 block text-sm text-dashboard-green">{status ? `+${status.estimatedProfitTodayDkk.toFixed(2)} DKK` : '---'}</strong></div>
        <MiniTrend />
      </div>
    </section>
  )
}

function BatteryScheduleChart({ labels, points, target }: { labels: string[]; points: number[]; target: number }) {
  const ticks = labels.length > 1
    ? [0, Math.round((labels.length - 1) * 0.2), Math.round((labels.length - 1) * 0.4), Math.round((labels.length - 1) * 0.6), Math.round((labels.length - 1) * 0.8), labels.length - 1]
    : []

  return (
    <div className="relative h-[170px] pb-5 pl-9 pt-1">
      <div className="absolute bottom-5 left-0 top-1 flex flex-col justify-between text-[10px] text-dashboard-soft"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
      <div className="absolute bottom-5 left-9 right-0 top-1 border-y border-white/[0.06] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_25%,rgba(255,255,255,0.045)_25%,rgba(255,255,255,0.045)_25.8%)]">
        <LineChart className="insight-line-chart" color="#60ea5d" label="Battery state of charge forecast" labels={labels} points={points} unit="%" />
        <span className="absolute left-0 right-0 top-[calc(100%-var(--target))] border-t border-dashed border-dashboard-green/55" style={{ '--target': `${Math.max(8, Math.min(92, target))}%` } as CSSProperties} />
        <span className="absolute bottom-0 top-0 left-1/2 border-l border-white/75"><i className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold not-italic text-white">Now</i></span>
      </div>
      <div className="absolute bottom-0 left-9 right-0 flex justify-between text-[10px] text-dashboard-soft">{ticks.map((index) => <span key={`${labels[index]}-${index}`}>{labels[index]}</span>)}</div>
    </div>
  )
}

function PriceWindow({ accent, icon, label, price, time }: { accent: 'purple' | 'sun'; icon: 'sun' | 'zap'; label: string; price: string; time: string }) {
  return <div className="rounded-[12px] border border-white/8 bg-[#0a121c]/82 px-2.5 py-2.5"><div className={cn('flex items-center gap-1.5 text-[9px] leading-none', accent === 'purple' ? 'text-dashboard-purple' : 'text-dashboard-orange')}><OverviewIcon name={icon} />{label}</div><strong className="mt-2 block text-[13px] text-white">{time}</strong><span className="mt-1 block text-[10px] text-dashboard-soft">Avg. price</span><span className="mt-0.5 block text-[10px] font-semibold text-dashboard-text">{price}</span></div>
}

function MiniTrend() { return <svg className="h-8 w-24 text-dashboard-green" fill="none" viewBox="0 0 96 32" aria-hidden="true"><path d="M1 24h10l5-7 6 4 8-13 7 8 6-3 7 8 7-12 7 5 7-7 8 9 7-3 8 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> }
function describeWindow(hours: string[] | undefined) { if (!hours?.length) return 'No window'; return hours.length === 1 ? hours[0] : `${hours[0]} - ${hours[hours.length - 1]}` }

function BatteryUsageCard({ distribution }: { distribution: { batteryCharge: string; batteryDischarge: string; gridExport: string; gridImport: string } }) {
  const charged = Math.max(0, Number.parseFloat(distribution.batteryCharge) || 0)
  const discharged = Math.max(0, Number.parseFloat(distribution.batteryDischarge) || 0)
  const imported = Math.max(0, Number.parseFloat(distribution.gridImport) || 0)
  const exported = Math.max(0, Number.parseFloat(distribution.gridExport) || 0)
  const total = charged + discharged + imported + exported
  const chargeShare = total ? Math.round((charged / total) * 100) : 0
  const dischargeShare = total ? Math.round((discharged / total) * 100) : 0
  const importShare = total ? Math.round((imported / total) * 100) : 0

  return (
    <section className="h-[270px] rounded-[18px] border border-white/10 bg-[linear-gradient(145deg,#132334,#0c141f)] p-4 shadow-[0_20px_55px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-white">Battery usage</h2><span className="rounded-full bg-dashboard-green/10 px-2 py-0.5 text-[10px] font-semibold text-dashboard-green">LIVE</span></div>
      <div className="mt-4 flex items-center gap-4">
        <div className="grid h-[118px] w-[118px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#5ddc78 0 ${chargeShare}%, #ffc229 ${chargeShare}% ${chargeShare + dischargeShare}%, #9a62ef ${chargeShare + dischargeShare}% ${chargeShare + dischargeShare + importShare}%, #aeb7c6 ${chargeShare + dischargeShare + importShare}% 100%)` }}>
          <div className="grid h-[82px] w-[82px] place-items-center rounded-full bg-[#101a27] text-center"><strong className="text-lg text-white">{(charged + discharged).toFixed(1)}</strong><span className="-mt-3 text-[10px] text-dashboard-soft">kWh cycled</span></div>
        </div>
        <div className="grid min-w-0 gap-2 text-[11px]">
          <UsageRead color="bg-dashboard-green" label="Charged" value={`${charged.toFixed(1)} kWh`} />
          <UsageRead color="bg-dashboard-orange" label="Discharged" value={`${discharged.toFixed(1)} kWh`} />
          <UsageRead color="bg-dashboard-purple" label="From grid" value={`${imported.toFixed(1)} kWh`} />
          <UsageRead color="bg-slate-300" label="Exported" value={`${exported.toFixed(1)} kWh`} />
        </div>
      </div>
    </section>
  )
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
function UsageRead({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex min-w-0 items-center gap-2"><i className={cn('h-2 w-2 shrink-0 rounded-full', color)} /><span className="min-w-0 flex-1 truncate text-dashboard-soft">{label}</span><strong className="shrink-0 text-dashboard-text">{value}</strong></div> }
function FlowRead({ icon, label, meta, tone, value }: { icon: 'car' | 'grid' | 'home' | 'solar'; label: string; meta?: string; tone: 'blue' | 'muted' | 'purple' | 'sun'; value: string }) { return <div className="rounded-[13px] border border-white/10 bg-[#0b121c]/95 px-2.5 py-2.5 shadow-[0_10px_22px_rgba(0,0,0,0.22)]"><span className={cn('flex items-center gap-1.5 text-xs', tone === 'sun' ? 'text-dashboard-orange' : tone === 'purple' ? 'text-dashboard-purple' : tone === 'blue' ? 'text-dashboard-blue' : 'text-dashboard-soft')}><OverviewIcon name={icon} />{label}</span><strong className="mt-1.5 block text-sm text-white">{value}</strong>{meta ? <span className="mt-1 block truncate text-[10px] text-dashboard-soft">{meta}</span> : null}</div> }
function MiniRead({ label, value }: { label: string; value: string }) { return <div><span className="block text-[10px] uppercase tracking-[0.1em] text-dashboard-muted">{label}</span><strong className="mt-1 block truncate text-sm text-dashboard-text">{value}</strong></div> }
function ActionRead({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 py-2"><span className="text-xs text-dashboard-soft">{label}</span><strong className="max-w-[62%] text-right text-sm font-semibold text-dashboard-text">{value}</strong></div> }
function shortPrice(value: number | undefined) { return value === undefined || !Number.isFinite(value) ? '---' : `${value.toFixed(2)} DKK` }

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
