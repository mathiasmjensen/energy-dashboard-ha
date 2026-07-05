import type { MobileDashboardProps, SolarPeriod } from './MobileTypes'
import { cn } from '../../lib/cn'
import {
  AnalyticsCard,
  FlowPath,
  GlassCard,
  MobileBarChart,
  MobileDataStateBadge,
  MobileIcon,
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
    <div className="flex flex-col gap-4 pb-4">
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
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!controls.canGoPrevious}
        type="button"
        onClick={controls.onPrevious}
      >
        <MobileIcon name="chevronLeft" />
      </button>
      <div className="inline-flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-center text-[13px] font-medium text-dashboard-text">
        {controls.label}
      </div>
      <button
        aria-label="Show next energy day"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="relative min-h-[332px] overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01)),radial-gradient(circle_at_50%_52%,rgba(82,111,170,0.1),transparent_42%),#101720] px-3 py-4">
      <div className="absolute inset-[12px] rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-[204px] w-[204px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" aria-hidden="true" />

      <FlowBadge
        className="left-[18px] top-[26px]"
        icon="solar"
        label="Solar"
        tone="gold"
        value={`${distribution.solar} kWh`}
      />

      <FlowBadge
        className="left-[18px] top-[218px]"
        icon="grid"
        label="Grid"
        meta={`In ${distribution.gridImport} · Out ${distribution.gridExport}`}
        tone="blue"
        value={`${distribution.gridImport} kWh`}
      />

      <FlowBadge
        align="right"
        className="right-[18px] top-[26px]"
        icon="battery"
        label="Batt."
        meta={`In ${distribution.batteryCharge} · Out ${distribution.batteryDischarge}`}
        tone="green"
        value={`${distribution.battery} kWh`}
      />

      <FlowBadge
        align="right"
        className="right-[18px] top-[226px]"
        icon="car"
        label="EV"
        tone="neutral"
        value={`${distribution.ev} kWh`}
      />

      <div className="absolute left-1/2 top-1/2 z-[2] flex h-[136px] w-[136px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[38px] border border-white/18 bg-[linear-gradient(180deg,rgba(11,18,28,0.97),rgba(8,12,18,0.98))] text-center shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.025] text-white/90">
          <MobileIcon className="h-5 w-5" name="home" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-dashboard-muted">Home</span>
        <strong className="mt-2 text-[16px] font-semibold leading-none text-dashboard-text">{distribution.home} kWh</strong>
      </div>

      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" viewBox="0 0 340 332" aria-hidden="true">
        <FlowPath color="#f7b62f" dash="12 34" direction="forward" path="M124 82 C144 82 152 94 160 112 C164 122 166 132 166 142" />
        <FlowPath color="#9a5cff" dash="12 34" direction={gridDirection} path="M124 244 C144 244 152 232 160 214 C164 204 166 194 166 184" />
        <FlowPath color="#57dd70" dash="12 34" direction={batteryDirection} path="M174 142 C174 126 178 114 188 102 C198 90 210 82 228 82" />
        <FlowPath color="#96a0b0" dash="12 36" direction={evDirection} path="M174 184 C174 200 178 212 188 224 C198 236 210 244 226 244" />
      </svg>
    </div>
  )
}

function FlowBadge({
  align = 'left',
  className,
  icon,
  label,
  meta,
  tone,
  value,
}: {
  align?: 'left' | 'right'
  className: string
  icon: 'battery' | 'car' | 'grid' | 'solar'
  label: string
  meta?: string
  tone: 'blue' | 'gold' | 'green' | 'neutral'
  value: string
}) {
  return (
    <div className={flowNodeClassName(tone, align, className)}>
      <div className={cn('flex items-center gap-3', align === 'right' && 'flex-row-reverse text-right')}>
        <div className={flowIconClassName(tone)}>
          <MobileIcon className="h-4 w-4" name={icon} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
          <strong className="mt-1 block text-[14px] font-semibold leading-none text-dashboard-text">{value}</strong>
          {meta ? <small className="mt-2 block text-[9px] leading-4 text-dashboard-soft">{meta}</small> : null}
        </div>
      </div>
    </div>
  )
}

function flowNodeClassName(tone: 'blue' | 'gold' | 'green' | 'neutral', _align: 'left' | 'right', className: string) {
  return cn(
    'absolute z-[2] w-[126px] rounded-[18px] border px-3 py-2.5 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-md',
    tone === 'gold' && 'border-dashboard-orange/18 bg-[linear-gradient(180deg,rgba(247,182,47,0.07),rgba(10,15,23,0.88))]',
    tone === 'blue' && 'border-dashboard-purple/18 bg-[linear-gradient(180deg,rgba(154,92,255,0.07),rgba(10,15,23,0.88))]',
    tone === 'green' && 'border-dashboard-green/18 bg-[linear-gradient(180deg,rgba(87,221,112,0.07),rgba(10,15,23,0.88))]',
    tone === 'neutral' && 'border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,15,23,0.88))]',
    className,
  )
}

function flowIconClassName(tone: 'blue' | 'gold' | 'green' | 'neutral') {
  return cn(
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#09111a]',
    tone === 'gold' && 'border-dashboard-orange/20 text-dashboard-orange shadow-[0_0_18px_rgba(247,182,47,0.14)]',
    tone === 'blue' && 'border-dashboard-purple/18 text-[#68b7ff] shadow-[0_0_18px_rgba(154,92,255,0.12)]',
    tone === 'green' && 'border-dashboard-green/20 text-dashboard-green shadow-[0_0_18px_rgba(87,221,112,0.12)]',
    tone === 'neutral' && 'border-white/14 text-white/78',
  )
}
