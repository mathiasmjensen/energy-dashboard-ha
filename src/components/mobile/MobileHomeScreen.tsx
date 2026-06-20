import type { ReactNode } from 'react'
import type { MobileDashboardProps } from './MobileTypes'
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
    <div className="mobile-screen mobile-screen--home">
      <div className="mobile-meta-row mobile-meta-row--home">
        <div className="mobile-meta-row__left">
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

      <div className="mobile-footnote">Last updated {displayDate} {displayTime}</div>
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
    <GlassCard className="mobile-home-hero-card">
      <div className="mobile-home-hero-frame">
        <img src={assetPath('/mobile-dashboard/image.png')} alt="Luxury home with solar roof, battery, EV charger, and Tesla" />
      </div>

      <div className="mobile-home-hero-stats">
        <div className="mobile-home-hero-stats__top">
          {topStats.map((stat) => (
            <HeroMetric key={stat.label} {...stat} />
          ))}
        </div>

        <div className="mobile-home-hero-stats__bottom">
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
    <div className="mobile-home-metric" data-compact={compact} data-tone={tone}>
      <div className="mobile-home-metric__icon">
        <MobileIcon name={icon} />
      </div>

      <div className="mobile-home-metric__copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {compact && meta ? <small>{meta}</small> : null}
      </div>

      {!compact && meta ? <em>{meta}</em> : null}
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
    <GlassCard className="mobile-home-insight-card">
      <div className="mobile-card-header">
        <h2>{title}</h2>
        <MobileInsightControls controls={controls} />
      </div>

      <div className="mobile-window-chip">{windowLabel}</div>

      <div className="mobile-home-insight-card__body">
        <div className="mobile-home-insight-card__headline">
          <span>{controls.mode === 'today' ? 'Today overview' : 'Timeline'}</span>
          <strong>
            {metric}
            <small>{unit}</small>
          </strong>
          <p>{metricLabel}</p>
        </div>

        <div className="mobile-home-insight-card__stats">
          {stats.map((item) => (
            <div className="mobile-home-insight-chip" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="mobile-home-insight-card__chart">{children}</div>
    </GlassCard>
  )
}
