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
    <div className="relative min-h-[324px] overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01)),radial-gradient(circle_at_50%_52%,rgba(86,115,172,0.08),transparent_44%),#111823] px-3 py-4">
      <div className="absolute inset-[12px] rounded-[18px] border border-white/8 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_58%)]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-[188px] w-[188px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] bg-[radial-gradient(circle,rgba(255,255,255,0.02),transparent_70%)]" aria-hidden="true" />

      <FlowNode
        className="left-[20px] top-[28px] w-[122px]"
        label="Solar"
        tone="gold"
        value={`${distribution.solar} kWh`}
      >
        <NodeIcon tone="gold">
          <MobileIcon name="solar" />
        </NodeIcon>
      </FlowNode>

      <FlowNode
        className="left-[20px] top-[210px] w-[124px]"
        detail={<FlowMetaLine values={[`In ${distribution.gridImport}`, `Out ${distribution.gridExport}`]} />}
        label="Grid"
        tone="blue"
        value={`${distribution.gridImport} kWh`}
      >
        <NodeIcon tone="blue">
          <MobileIcon name="grid" />
        </NodeIcon>
      </FlowNode>

      <FlowNode
        align="right"
        className="right-[20px] top-[28px] w-[126px]"
        detail={<FlowMetaLine values={[`In ${distribution.batteryCharge}`, `Out ${distribution.batteryDischarge}`]} />}
        label="Batt."
        tone="green"
        value={`${distribution.battery} kWh`}
      >
        <NodeIcon tone="green">
          <MobileIcon name="battery" />
        </NodeIcon>
      </FlowNode>

      <FlowNode
        align="right"
        className="right-[20px] top-[218px] w-[108px]"
        label="EV"
        tone="neutral"
        value={`${distribution.ev} kWh`}
      >
        <NodeIcon tone="neutral">
          <MobileIcon name="car" />
        </NodeIcon>
      </FlowNode>

      <div className="absolute left-1/2 top-1/2 z-[2] grid h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[34px] border border-white/18 bg-[linear-gradient(180deg,rgba(10,17,27,0.96),rgba(8,12,18,0.98))] px-4 py-4 text-center shadow-[0_24px_56px_rgba(0,0,0,0.26)]">
        <NodeIcon tone="white">
          <MobileIcon name="home" />
        </NodeIcon>
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Home</span>
        <strong className="text-[16px] font-semibold text-dashboard-text">{distribution.home} kWh</strong>
      </div>

      <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" viewBox="0 0 340 312" aria-hidden="true">
        <FlowPath color="#f7b62f" dash="10 30" direction="forward" path="M142 78 C152 78 160 86 164 98 C168 108 168 118 168 126" />
        <FlowPath color="#9a5cff" dash="10 30" direction={gridDirection} path="M144 230 C154 230 160 222 164 210 C168 200 168 190 168 182" />
        <FlowPath color="#57dd70" dash="10 30" direction={batteryDirection} path="M172 126 C172 116 176 104 186 94 C196 84 206 78 218 78" />
        <FlowPath color="#8d96a6" dash="10 32" direction={evDirection} path="M172 182 C172 194 176 204 186 214 C194 222 204 230 216 230" />
      </svg>
    </div>
  )
}

function FlowNode({
  align = 'left',
  children,
  className,
  detail,
  label,
  tone,
  value,
}: {
  align?: 'left' | 'right'
  children: ReactNode
  className: string
  detail?: ReactNode
  label: string
  tone: 'blue' | 'gold' | 'green' | 'neutral'
  value: string
}) {
  return (
    <div className={flowNodeClassName(tone, align, className)}>
      <div className={cn('flex items-start gap-3', align === 'right' && 'flex-row-reverse text-right')}>
        {children}
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
          <strong className="mt-1 block text-[14px] font-semibold leading-none text-dashboard-text">{value}</strong>
          {detail ? <div className="mt-2">{detail}</div> : null}
        </div>
      </div>
    </div>
  )
}

function FlowMetaLine({
  values,
}: {
  values: string[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          className="inline-flex min-h-5 items-center rounded-full border border-white/10 bg-white/[0.045] px-2 text-[9px] font-medium leading-none text-dashboard-soft"
          key={value}
        >
          {value}
        </span>
      ))}
    </div>
  )
}

function flowNodeClassName(tone: 'blue' | 'gold' | 'green' | 'neutral', align: 'left' | 'right', className: string) {
  return cn(
    'absolute z-[2] rounded-[18px] border bg-[linear-gradient(180deg,rgba(12,18,28,0.94),rgba(10,15,23,0.9))] px-3 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.22)] backdrop-blur-md [&_.mobile-node-icon]:h-8 [&_.mobile-node-icon]:w-8 [&_.mobile-node-icon_svg]:h-3.5 [&_.mobile-node-icon_svg]:w-3.5',
    align === 'right' && '[&_.mobile-node-icon]:order-2',
    tone === 'gold' && 'border-dashboard-orange/25',
    tone === 'blue' && 'border-dashboard-purple/25',
    tone === 'green' && 'border-dashboard-green/25',
    tone === 'neutral' && 'border-white/15',
    className,
  )
}
