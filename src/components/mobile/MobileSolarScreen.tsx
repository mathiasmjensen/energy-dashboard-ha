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
  const evFromHome = distribution.ev

  return (
    <div className="relative min-h-[432px] overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_50%_18%,rgba(46,74,118,0.14),transparent_40%),linear-gradient(180deg,#101722,#0b1118)] px-3 py-4">
      <div className="absolute inset-[10px] rounded-[18px] border border-white/8" aria-hidden="true" />

      <FlowReferenceCard
        className="left-[18px] top-[22px] h-[118px] w-[112px]"
        icon="solar"
        label="SOLAR"
        primary={`${distribution.solar} kWh`}
        tone="gold"
      />

      <FlowReferenceCard
        className="right-[18px] top-[22px] h-[118px] w-[118px]"
        icon="battery"
        label="BATTERY"
        primary={`${distribution.battery} kWh`}
        tone="green"
      />

      <FlowReferenceCard
        className="left-[18px] top-[190px] h-[118px] w-[112px]"
        icon="grid"
        label="GRID"
        primary={`${distribution.gridImport} kWh`}
        tone="purple"
      />

      <FlowReferenceCard
        className="right-[18px] top-[190px] h-[118px] w-[118px]"
        icon="car"
        label="EV CHARGER"
        primary={`${distribution.ev} kWh`}
        tone="blue"
      />

      <div className="absolute left-1/2 top-[116px] z-[2] flex h-[104px] w-[104px] -translate-x-1/2 flex-col items-center justify-center rounded-full border border-emerald-400/60 bg-[radial-gradient(circle_at_50%_45%,rgba(56,116,68,0.28),rgba(7,13,11,0.98)_72%)] text-center shadow-[0_0_42px_rgba(112,245,128,0.22)]">
        <MobileIcon className="mb-2 h-7 w-7 text-white" name="home" />
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#76f067]">HOME</span>
        <strong className="mt-1.5 text-[17px] font-semibold leading-none text-white">{distribution.home}</strong>
        <span className="mt-1 text-[10px] text-white/78">kWh</span>
      </div>

      <div className="absolute left-1/2 top-[128px] z-[3] -translate-x-[50px]">
        <FlowDirectionMarker direction="forward" tone="gold" />
      </div>
      <div className="absolute left-1/2 top-[128px] z-[3] translate-x-[26px]">
        <FlowDirectionMarker direction={batteryDirection} tone="green" />
      </div>
      <div className="absolute left-1/2 top-[218px] z-[3] -translate-x-[76px]">
        <FlowDirectionMarker direction={gridDirection} tone="purple" />
      </div>
      <div className="absolute left-1/2 top-[218px] z-[3] translate-x-[56px]">
        <FlowDirectionMarker direction={evDirection} tone="blue" />
      </div>

      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" viewBox="0 0 340 432" aria-hidden="true">
        <FlowPath color="#ffd33d" dash="12 30" direction="forward" path="M130 82 C150 82 160 98 160 116 L160 128" />
        <FlowPath color="#69e760" dash="12 30" direction={batteryDirection} path="M180 128 L180 116 C180 98 192 82 210 82" />
        <FlowPath color="#9a5cff" dash="12 30" direction={gridDirection} path="M130 250 C150 250 160 234 160 214 L160 208" />
        <FlowPath color="#4c95ff" dash="12 30" direction={evDirection} path="M180 208 L180 214 C180 234 194 250 214 250" />
      </svg>

      <div className="absolute bottom-[16px] left-[18px] right-[18px] z-[2] grid grid-cols-4 rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] px-2.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
        <FlowLegendItem label="Generated" tone="gold" value={`${distribution.solar} kWh`} />
        <FlowLegendItem label="To Home" tone="green" value={`${distribution.home} kWh`} />
        <FlowLegendItem label="From Grid" tone="purple" value={`${distribution.gridImport} kWh`} />
        <FlowLegendItem label="To Others" tone="blue" value={`${distribution.ev || evFromHome} kWh`} />
      </div>
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
      <div className="flex h-full flex-col items-center justify-center px-4 py-5 text-center">
        <div className={referenceIconClassName(tone)}>
          <MobileIcon className="h-5 w-5" name={icon} />
        </div>
        <span className={referenceLabelClassName(tone)}>{label}</span>
        <strong className="mt-3 text-[17px] font-semibold leading-none text-white">{primary}</strong>
      </div>
    </div>
  )
}

function FlowDirectionMarker({
  direction,
  tone,
}: {
  direction: 'forward' | 'reverse'
  tone: 'blue' | 'gold' | 'green' | 'purple'
}) {
  const isForward = direction === 'forward'
  const iconClass =
    tone === 'gold'
      ? 'text-[#ffd33d]'
      : tone === 'green'
        ? 'text-[#6be85f]'
        : tone === 'purple'
          ? 'text-[#9a5cff]'
          : 'text-[#4c95ff]'

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[#111924]/96 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
      <MobileIcon className={cn('h-4 w-4', iconClass)} name={isForward ? 'chevronRight' : 'chevronLeft'} />
    </div>
  )
}

function FlowLegendItem({
  label,
  tone,
  value,
}: {
  label: string
  tone: 'blue' | 'gold' | 'green' | 'purple'
  value: string
}) {
  return (
    <div className="border-l border-white/10 px-2 first:border-l-0 first:pl-0 last:pr-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-3 w-3 rounded-full',
            tone === 'gold' && 'bg-[#ffd33d]',
            tone === 'green' && 'bg-[#6be85f]',
            tone === 'purple' && 'bg-[#9a5cff]',
            tone === 'blue' && 'bg-[#4c95ff]',
          )}
        />
        <span className="text-[10px] text-white/70">{label}</span>
      </div>
      <strong className="mt-2 block text-[11px] font-semibold text-white">{value}</strong>
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
    'inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-[#0b1119]',
    tone === 'gold' && 'border-dashboard-orange/20 text-dashboard-orange shadow-[0_0_18px_rgba(247,182,47,0.14)]',
    tone === 'blue' && 'border-[#4c95ff]/20 text-[#4c95ff] shadow-[0_0_18px_rgba(76,149,255,0.16)]',
    tone === 'green' && 'border-dashboard-green/20 text-dashboard-green shadow-[0_0_18px_rgba(87,221,112,0.12)]',
    tone === 'purple' && 'border-dashboard-purple/18 text-dashboard-purple shadow-[0_0_18px_rgba(154,92,255,0.14)]',
  )
}

function referenceLabelClassName(tone: 'blue' | 'gold' | 'green' | 'purple') {
  return cn(
    'mt-4 text-[11px] font-medium',
    tone === 'gold' && 'text-dashboard-orange',
    tone === 'green' && 'text-dashboard-green',
    tone === 'purple' && 'text-dashboard-purple',
    tone === 'blue' && 'text-[#4c95ff]',
  )
}
