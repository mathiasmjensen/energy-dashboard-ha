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
    <div className="relative min-h-[344px] overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_50%_18%,rgba(46,74,118,0.14),transparent_40%),linear-gradient(180deg,#101722,#0b1118)] px-3 py-4">
      <div className="absolute inset-[10px] rounded-[18px] border border-white/8" aria-hidden="true" />

      <FlowReferenceCard
        className="left-[16px] top-[18px] h-[102px] w-[114px]"
        icon="solar"
        label="SOLAR"
        primary={`${distribution.solar} kWh`}
        tone="gold"
      />

      <FlowReferenceCard
        className="right-[16px] top-[18px] h-[102px] w-[114px]"
        icon="battery"
        label="BATTERY"
        primary={`${distribution.battery} kWh`}
        tone="green"
      />

      <FlowReferenceCard
        className="left-[16px] top-[228px] h-[102px] w-[114px]"
        icon="grid"
        label="GRID"
        primary={`${distribution.gridImport} kWh`}
        tone="purple"
      />

      <FlowReferenceCard
        className="right-[16px] top-[228px] h-[102px] w-[114px]"
        icon="car"
        label="EV"
        primary={`${distribution.ev} kWh`}
        tone="blue"
      />

      <div className="absolute left-1/2 top-[118px] z-[2] flex h-[108px] w-[108px] -translate-x-1/2 flex-col items-center justify-center rounded-full border border-emerald-400/60 bg-[radial-gradient(circle_at_50%_45%,rgba(56,116,68,0.28),rgba(7,13,11,0.98)_72%)] text-center shadow-[0_0_42px_rgba(112,245,128,0.22)]">
        <MobileIcon className="mb-2 h-7 w-7 text-white" name="home" />
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#76f067]">HOME</span>
        <strong className="mt-1.5 text-[18px] font-semibold leading-none text-white">{distribution.home}</strong>
        <span className="mt-1 text-[10px] text-white/78">kWh</span>
      </div>

      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" viewBox="0 0 340 344" aria-hidden="true">
        <FlowPath color="#ffd33d" dash="12 24" direction="forward" path="M130 72 C150 72 158 90 158 112 L158 138" />
        <FlowPath color="#69e760" dash="12 24" direction={batteryDirection} path="M182 138 L182 112 C182 90 192 72 210 72" />
        <FlowPath color="#9a5cff" dash="12 24" direction={gridDirection} path="M130 274 C150 274 158 256 158 228 L158 206" />
        <FlowPath color="#4c95ff" dash="12 24" direction={evDirection} path="M182 206 L182 228 C182 256 194 274 210 274" />
      </svg>
    </div>
  )
}

function FlowReferenceCard({
  className,
  icon,
  label,
  primary,
  tone,
}: {
  className: string
  icon: 'battery' | 'car' | 'grid' | 'solar'
  label: string
  primary: string
  tone: 'blue' | 'gold' | 'green' | 'purple'
}) {
  return (
    <div className={referenceCardClassName(tone, className)}>
      <div className="flex h-full flex-col items-center justify-center px-3 py-4 text-center">
        <div className={referenceIconClassName(tone)}>
          <MobileIcon className="h-5 w-5" name={icon} />
        </div>
        <span className={referenceLabelClassName(tone)}>{label}</span>
        <strong className="mt-2 text-[15px] font-semibold leading-tight text-white">{primary}</strong>
      </div>
    </div>
  )
}

function referenceCardClassName(tone: 'blue' | 'gold' | 'green' | 'purple', className: string) {
  return cn(
    'absolute z-[2] rounded-[22px] border bg-[linear-gradient(180deg,rgba(18,24,34,0.96),rgba(12,18,28,0.92))] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-md',
    tone === 'gold' && 'border-dashboard-orange/18 bg-[linear-gradient(180deg,rgba(247,182,47,0.07),rgba(10,15,23,0.88))]',
    tone === 'blue' && 'border-[#4c95ff]/18 bg-[linear-gradient(180deg,rgba(76,149,255,0.07),rgba(10,15,23,0.88))]',
    tone === 'green' && 'border-dashboard-green/18 bg-[linear-gradient(180deg,rgba(87,221,112,0.07),rgba(10,15,23,0.88))]',
    tone === 'purple' && 'border-dashboard-purple/18 bg-[linear-gradient(180deg,rgba(154,92,255,0.07),rgba(10,15,23,0.88))]',
    className,
  )
}

function referenceIconClassName(tone: 'blue' | 'gold' | 'green' | 'purple') {
  return cn(
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#0b1119]',
    tone === 'gold' && 'border-dashboard-orange/20 text-dashboard-orange shadow-[0_0_18px_rgba(247,182,47,0.14)]',
    tone === 'blue' && 'border-[#4c95ff]/20 text-[#4c95ff] shadow-[0_0_18px_rgba(76,149,255,0.16)]',
    tone === 'green' && 'border-dashboard-green/20 text-dashboard-green shadow-[0_0_18px_rgba(87,221,112,0.12)]',
    tone === 'purple' && 'border-dashboard-purple/18 text-dashboard-purple shadow-[0_0_18px_rgba(154,92,255,0.14)]',
  )
}

function referenceLabelClassName(tone: 'blue' | 'gold' | 'green' | 'purple') {
  return cn(
    'mt-2.5 text-[10px] font-medium tracking-[0.06em]',
    tone === 'gold' && 'text-dashboard-orange',
    tone === 'green' && 'text-dashboard-green',
    tone === 'purple' && 'text-dashboard-purple',
    tone === 'blue' && 'text-[#4c95ff]',
  )
}
