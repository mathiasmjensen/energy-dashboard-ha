import type { ReactNode } from 'react'
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
    <div className="relative min-h-[318px] overflow-hidden rounded-[22px] border border-white/6 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.035),transparent_52%)] px-3 py-4">
      <div className="absolute left-0 right-0 top-0 z-[1] grid h-full grid-cols-2 gap-x-4 px-1">
        <div className="flex flex-col justify-between py-1">
          <FlowEndpointCard label="Solar" tone="gold" value={`${distribution.solar} kWh`}>
            <NodeIcon tone="gold">
              <MobileIcon name="solar" />
            </NodeIcon>
          </FlowEndpointCard>

          <FlowEndpointCard
            label="Grid"
            meta={`In ${distribution.gridImport} · Out ${distribution.gridExport}`}
            tone="blue"
            value={`${distribution.gridImport} kWh`}
          >
            <NodeIcon tone="blue">
              <MobileIcon name="grid" />
            </NodeIcon>
          </FlowEndpointCard>
        </div>

        <div className="flex flex-col justify-between py-1">
          <FlowEndpointCard
            align="right"
            label="Battery"
            meta={`In ${distribution.batteryCharge} · Out ${distribution.batteryDischarge}`}
            tone="green"
            value={`${distribution.battery} kWh`}
          >
            <NodeIcon tone="green">
              <MobileIcon name="battery" />
            </NodeIcon>
          </FlowEndpointCard>

          <FlowEndpointCard align="right" label="EV" tone="neutral" value={`${distribution.ev} kWh`}>
            <NodeIcon tone="neutral">
              <MobileIcon name="car" />
            </NodeIcon>
          </FlowEndpointCard>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-[2] grid h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28px] border border-white/18 bg-[#0b111b]/94 px-4 py-4 text-center shadow-[0_24px_56px_rgba(0,0,0,0.26)]">
        <NodeIcon tone="white">
          <MobileIcon name="home" />
        </NodeIcon>
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Home</span>
        <strong className="text-[15px] font-semibold text-dashboard-text">{distribution.home} kWh</strong>
      </div>

      <svg className="pointer-events-none absolute inset-x-0 top-0 h-full w-full overflow-visible" viewBox="0 0 340 318" aria-hidden="true">
        <FlowPath color="#f7b62f" direction="forward" path="M96 82 H138 C158 82 160 110 160 126" />
        <FlowPath color="#9a5cff" direction={gridDirection} path="M96 236 H138 C158 236 160 208 160 192" />
        <FlowPath color="#57dd70" direction={batteryDirection} path="M180 126 C180 110 182 82 202 82 H244" />
        <FlowPath color="#707788" direction={evDirection} path="M180 192 C180 208 182 236 202 236 H244" />
      </svg>
    </div>
  )
}

function FlowEndpointCard({
  align = 'left',
  children,
  label,
  meta,
  tone,
  value,
}: {
  align?: 'left' | 'right'
  children: ReactNode
  label: string
  meta?: string
  tone: 'blue' | 'gold' | 'green' | 'neutral'
  value: string
}) {
  return (
    <div className={flowNodeClassName(tone, align)}>
      <div className={cn('flex items-start gap-3', align === 'right' && 'flex-row-reverse text-right')}>
        {children}
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
          <strong className="mt-1 block text-[14px] font-semibold leading-none text-dashboard-text">{value}</strong>
          {meta ? <small className="mt-1.5 block text-[10px] leading-4 text-dashboard-soft">{meta}</small> : null}
        </div>
      </div>
    </div>
  )
}

function flowNodeClassName(tone: 'blue' | 'gold' | 'green' | 'neutral', align: 'left' | 'right') {
  return cn(
    'z-[2] w-full rounded-[20px] border bg-[#0a111b]/92 px-3 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.22)] [&_.mobile-node-icon]:h-9 [&_.mobile-node-icon]:w-9 [&_.mobile-node-icon_svg]:h-4 [&_.mobile-node-icon_svg]:w-4',
    align === 'left' ? 'mr-auto max-w-[132px]' : 'ml-auto max-w-[136px]',
    tone === 'gold' && 'border-dashboard-orange/25',
    tone === 'blue' && 'border-dashboard-purple/25',
    tone === 'green' && 'border-dashboard-green/25',
    tone === 'neutral' && 'border-white/15',
  )
}
