import type { ReactNode } from 'react'
import type { MobileDashboardProps } from './MobileTypes'
import { cn } from '../../lib/cn'
import { assetPath } from '../../utils/assetPath'
import { GlassCard, MobileBarChart, MobileIcon, MobileInsightControls, StatusChip } from './MobilePrimitives'

export function MobileHomeScreen({
  battery,
  displayDate,
  displayTime,
  insightControls,
  overview,
  prices,
  solarForecast,
  weather,
}: Pick<MobileDashboardProps, 'battery' | 'displayDate' | 'displayTime' | 'insightControls' | 'overview' | 'prices' | 'solarForecast' | 'weather'>) {
  const forecastStats = solarForecast.summaryItems.slice(0, 2)
  const priceStats = prices.summaryItems.slice(0, 2)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusChip tone="green">Normal</StatusChip>
          <StatusChip tone="gold">
            <MobileIcon name="sun" />
            {weather.temperature}
          </StatusChip>
        </div>

        <StatusChip tone="neutral">
          <MobileIcon name="refresh" />
          Refreshing
        </StatusChip>
      </div>

      <HomeHeroCard battery={battery} overview={overview} />

      <HomeInsightCard
        controls={insightControls}
        metric={solarForecast.totalKwh}
        metricLabel="Total forecast"
        stats={forecastStats}
        title="Solar forecast"
        unit="kWh"
        windowLabel={solarForecast.windowLabel}
      >
        <MobileBarChart color="#f7b62f" labels={solarForecast.pointLabels} unit="kWh" values={solarForecast.points} />
      </HomeInsightCard>

      <HomeInsightCard
        controls={insightControls}
        metric={prices.primaryValue}
        metricLabel="Average price"
        stats={priceStats}
        title="Energy prices"
        unit="DKK/kWh"
        windowLabel={prices.windowLabel}
      >
        <MobileBarChart color="#3b82ff" labels={prices.pointLabels} unit="DKK/kWh" values={prices.points} />
      </HomeInsightCard>

      <div className="px-1 text-[12px] text-[#7f8998]">Last updated {displayDate} {displayTime}</div>
    </div>
  )
}

function HomeHeroCard({
  battery,
  overview,
}: {
  battery: MobileDashboardProps['battery']
  overview: MobileDashboardProps['overview']
}) {
  const topStats = [
    { icon: 'solar' as const, label: 'PV', tone: 'green' as const, value: `${overview.solarPower} kW` },
    { icon: 'sun' as const, label: 'Solar', tone: 'gold' as const, value: `${overview.solarPower} kW` },
  ]

  const bottomStats = [
    { icon: 'grid' as const, label: 'Grid', meta: overview.gridMeta, tone: 'blue' as const, value: `${overview.gridPower} kW` },
    { icon: 'battery' as const, label: 'Battery', meta: battery.soc, tone: 'green' as const, value: `${overview.batteryPower} kW` },
    { icon: 'home' as const, label: 'Home', tone: 'purple' as const, value: `${overview.homePower} kW` },
  ]

  return (
    <GlassCard className="flex flex-col gap-4 rounded-[28px] p-4">
      <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#08101d]">
        <img src={assetPath('/mobile-dashboard/image.png')} alt="Luxury home with solar roof, battery, EV charger, and Tesla" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {topStats.map((stat) => (
            <HeroMetric key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {bottomStats.map((stat) => (
            <HeroMetric key={stat.label} {...stat} compact />
          ))}
        </div>
      </div>
    </GlassCard>
  )
}

function HeroMetric({
  compact = false,
  icon,
  label,
  meta,
  tone,
  value,
}: {
  compact?: boolean
  icon: 'battery' | 'grid' | 'home' | 'solar' | 'sun'
  label: string
  meta?: string
  tone: 'blue' | 'gold' | 'green' | 'purple'
  value: string
}) {
  return (
    <div
      className={cn(
        'rounded-[18px] border px-3 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.16)]',
        compact ? 'grid gap-2 bg-white/[0.03]' : 'grid grid-cols-[40px_1fr] items-start gap-3 bg-white/[0.04]',
        toneClasses[tone],
      )}
    >
      <div
        className={cn(
          'grid place-items-center rounded-2xl border border-current/15 bg-current/10',
          compact ? 'h-9 w-9' : 'h-10 w-10',
        )}
      >
        <MobileIcon name={icon} />
      </div>

      <div className={cn('min-w-0', compact ? 'grid gap-1' : 'grid gap-1')}>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
        <strong className={cn('font-semibold text-dashboard-text', compact ? 'text-sm' : 'text-base')}>{value}</strong>
        {compact && meta ? <small className="text-[11px] text-dashboard-soft">{meta}</small> : null}
      </div>

      {!compact && meta ? <em className="col-span-2 text-[11px] not-italic text-dashboard-soft">{meta}</em> : null}
    </div>
  )
}

function HomeInsightCard({
  children,
  controls,
  metric,
  metricLabel,
  stats,
  title,
  unit,
  windowLabel,
}: {
  children: ReactNode
  controls: MobileDashboardProps['insightControls']
  metric: string
  metricLabel: string
  stats: Array<{ label: string; value: string }>
  title: string
  unit: string
  windowLabel: string
}) {
  return (
    <GlassCard className="flex flex-col gap-4 rounded-[24px] p-4">
      <div className="mb-0 flex items-start justify-between gap-3">
        <h2 className="text-[clamp(18px,4.8vw,22px)] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        <MobileInsightControls controls={controls} />
      </div>

      <div className="mobile-window-chip">{windowLabel}</div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.9fr)]">
        <div className="grid content-start gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{controls.mode === 'today' ? 'Today overview' : 'Timeline'}</span>
          <strong className="text-[2rem] font-semibold leading-none text-dashboard-text">
            {metric}
            <small className="ml-1 text-[1rem] font-semibold text-dashboard-soft">{unit}</small>
          </strong>
          <p className="text-sm text-dashboard-soft">{metricLabel}</p>
        </div>

        <div className="grid gap-2">
          {stats.map((item) => (
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2.5" key={item.label}>
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{item.label}</span>
              <strong className="mt-1 block text-sm font-semibold text-dashboard-text">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[20px] border border-white/8 bg-[#09101a]/72 p-2">{children}</div>
    </GlassCard>
  )
}

const toneClasses: Record<'blue' | 'gold' | 'green' | 'purple', string> = {
  blue: 'border-dashboard-blue/25 text-dashboard-blue',
  gold: 'border-dashboard-orange/25 text-dashboard-orange',
  green: 'border-dashboard-green/25 text-dashboard-green',
  purple: 'border-dashboard-purple/25 text-dashboard-purple',
}
