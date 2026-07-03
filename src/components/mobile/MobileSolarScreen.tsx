import type { MobileDashboardProps, SolarPeriod } from './MobileTypes'
import { cn } from '../../lib/cn'
import {
  AnalyticsCard,
  FlowPath,
  GlassCard,
  MobileBarChart,
  MobileDataStateBadge,
  MobileIcon,
  NodeIcon,
  SegmentedControl,
} from './MobilePrimitives'
import { SOLAR_PERIODS } from './MobileConstants'

export function MobileSolarScreen({
  distribution,
  energyDayControls,
  insightControls,
  overview,
  period,
  prices,
  solarForecast,
  solarProduction,
  onPeriodChange,
}: Pick<
  MobileDashboardProps,
  'distribution' | 'energyDayControls' | 'insightControls' | 'overview' | 'prices' | 'solarForecast' | 'solarProduction'
> & {
  period: SolarPeriod
  onPeriodChange: (period: SolarPeriod) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        active={period}
        ariaLabel="Solar analytics period"
        options={SOLAR_PERIODS}
        onChange={(value) => onPeriodChange(value as SolarPeriod)}
      />

      <GlassCard className="flex flex-col gap-4 rounded-[24px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[clamp(18px,4.8vw,22px)] font-semibold tracking-[-0.02em] text-white">Energy flow</h2>
            {distribution.dataState ? <MobileDataStateBadge badge={distribution.dataState} /> : null}
          </div>
          <MobileDayControls controls={energyDayControls} />
        </div>
        <SolarFlowDiagram distribution={distribution} overview={overview} />
      </GlassCard>

      <AnalyticsCard
        accent="solar"
        badge={solarProduction.dataState}
        controlsNode={<MobileDayControls controls={energyDayControls} />}
        metric={solarProduction.value}
        title="Solar production"
        unit="kWh"
        windowLabel={energyDayControls.label}
      >
        <MobileBarChart
          labels={solarProduction.labels}
          unit="kWh"
          values={solarProduction.curve}
        />
      </AnalyticsCard>

      <AnalyticsCard
        accent="solar"
        actionLabel="Today"
        badge={solarForecast.dataState}
        controls={insightControls}
        metric={solarForecast.totalKwh}
        summary={solarForecast.summaryItems}
        title="Solar forecast"
        unit="kWh"
        windowLabel={solarForecast.windowLabel}
      >
        <MobileBarChart color="#f7b62f" labels={solarForecast.pointLabels} unit="kWh" values={solarForecast.points} />
      </AnalyticsCard>

      <AnalyticsCard
        accent="blue"
        actionLabel="Today"
        badge={prices.dataState}
        controls={insightControls}
        metric={prices.primaryValue}
        summary={prices.summaryItems}
        title="Energy prices"
        unit="DKK/kWh"
        windowLabel={prices.windowLabel}
      >
        <MobileBarChart color="#3b82ff" labels={prices.pointLabels} unit="DKK/kWh" values={prices.points} />
      </AnalyticsCard>
    </div>
  )
}

function MobileDayControls({ controls }: { controls: MobileDashboardProps['energyDayControls'] }) {
  return (
    <div className="flex w-full items-center gap-2">
      <button
        aria-label="Show previous energy day"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!controls.canGoPrevious}
        type="button"
        onClick={controls.onPrevious}
      >
        <MobileIcon name="chevronLeft" />
      </button>
      <div className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-center text-sm font-medium text-dashboard-text">
        {controls.label}
      </div>
      <button
        aria-label="Show next energy day"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!controls.canGoNext}
        type="button"
        onClick={controls.onNext}
      >
        <MobileIcon name="chevronRight" />
      </button>
    </div>
  )
}

function SolarFlowDiagram({
  distribution,
  overview,
}: {
  distribution: MobileDashboardProps['distribution']
  overview: MobileDashboardProps['overview']
}) {
  const batteryDirection = overview.batteryMeta.toLowerCase().includes('charging') ? 'forward' : 'reverse'
  const gridDirection = overview.gridMeta.toLowerCase().includes('import') ? 'forward' : 'reverse'
  const evDirection = overview.evMeta.toLowerCase().includes('charg') ? 'forward' : 'reverse'

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,0.03),transparent_48%)] px-3 py-4">
      <div className={flowNodeClassName('solar')}>
        <NodeIcon tone="gold">
          <MobileIcon name="solar" />
        </NodeIcon>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Solar</span>
        <strong className="text-sm font-semibold text-dashboard-text">{distribution.solar} kWh</strong>
      </div>

      <div className={flowNodeClassName('grid')}>
        <NodeIcon tone="blue">
          <MobileIcon name="grid" />
        </NodeIcon>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Grid</span>
        <strong className="text-sm font-semibold text-dashboard-text">{distribution.gridImport} kWh</strong>
        <div className="mt-1 grid gap-0.5 border-t border-white/8 pt-1">
          <span className="text-[10px] text-dashboard-soft">From {distribution.gridImport} kWh</span>
          <span className="text-[10px] text-dashboard-soft">To {distribution.gridExport} kWh</span>
        </div>
      </div>

      <div className="absolute left-1/2 top-[122px] z-[2] grid w-[112px] -translate-x-1/2 rounded-[22px] border border-white/16 bg-[#0a111b]/92 px-4 py-3 text-center shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
        <NodeIcon tone="white">
          <MobileIcon name="home" />
        </NodeIcon>
        <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Home</span>
        <strong className="mt-1 text-sm font-semibold text-dashboard-text">{distribution.home} kWh</strong>
      </div>

      <div className={flowNodeClassName('battery')}>
        <NodeIcon tone="green">
          <MobileIcon name="battery" />
        </NodeIcon>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Battery</span>
        <strong className="text-sm font-semibold text-dashboard-text">{distribution.battery} kWh</strong>
        <div className="mt-1 grid gap-0.5 border-t border-white/8 pt-1">
          <span className="text-[10px] text-dashboard-soft">To {distribution.batteryCharge} kWh</span>
          <span className="text-[10px] text-dashboard-soft">From {distribution.batteryDischarge} kWh</span>
        </div>
      </div>

      <div className={flowNodeClassName('ev')}>
        <NodeIcon tone="neutral">
          <MobileIcon name="car" />
        </NodeIcon>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">EV Charger</span>
        <strong className="text-sm font-semibold text-dashboard-text">{distribution.ev} kWh</strong>
      </div>

      <svg className="pointer-events-none absolute inset-x-0 top-[22px] h-[248px] w-full overflow-visible" viewBox="0 0 320 248" aria-hidden="true">
        <FlowPath color="#f7b62f" direction="forward" path="M82 44 H126 C148 44 154 58 154 84" />
        <FlowPath color="#9a5cff" direction={gridDirection} path="M82 196 H126 C148 196 154 182 154 156" />
        <FlowPath color="#57dd70" direction={batteryDirection} path="M166 84 C172 58 182 44 206 44 H238" />
        <FlowPath color="#707788" direction={evDirection} path="M166 156 C172 182 182 196 206 196 H238" />
      </svg>
    </div>
  )
}

function flowNodeClassName(tone: 'battery' | 'ev' | 'grid' | 'solar') {
  return cn(
    'absolute z-[2] grid w-[96px] gap-1 rounded-[20px] border bg-[#0a111b]/92 px-3 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.22)]',
    tone === 'solar' && 'left-0 top-2 border-dashboard-orange/25',
    tone === 'grid' && 'bottom-2 left-0 border-dashboard-purple/25',
    tone === 'battery' && 'right-0 top-2 border-dashboard-green/25',
    tone === 'ev' && 'bottom-2 right-0 border-white/15',
  )
}
