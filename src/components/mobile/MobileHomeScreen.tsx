import type { ReactNode } from 'react'
import type { MobileDashboardProps } from './MobileTypes'
import { cn } from '../../lib/cn'
import { assetPath } from '../../utils/assetPath'
import {
  GlassCard,
  MobileBarChart,
  MobileDataStateBadge,
  MobileIcon,
  MobileInsightControls,
  StatusChip,
} from './MobilePrimitives'

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
  return (
    <div className="flex flex-col gap-4 pb-4">
      <GlassCard className="rounded-[22px] px-3 py-2.5">
        <div className="grid grid-cols-3 gap-3">
          <CompactStatusMeta icon="sun" label="Weather" secondary={weather.condition} tone="gold" value={weather.temperature} />
          <CompactStatusMeta icon="refresh" label="Updated" secondary={displayDate} tone="blue" value={displayTime} />
          <CompactStatusMeta icon="battery" label="System" secondary={battery.status} tone="green" value="Normal" />
        </div>
      </GlassCard>

      <HomeHeroCard battery={battery} overview={overview} />

      <DesktopLikeInsightCard
        controls={insightControls}
        badge={solarForecast.dataState}
        metric={solarForecast.totalKwh}
        metricLabel={solarForecast.primaryLabel}
        summary={solarForecast.summaryItems.slice(0, 2)}
        title="Solar forecast"
        unit="kWh"
        windowLabel={solarForecast.windowLabel}
      >
        <MobileBarChart color="#f7b62f" labels={solarForecast.pointLabels} unit="kWh" values={solarForecast.points} />
      </DesktopLikeInsightCard>

      <DesktopLikeInsightCard
        controls={insightControls}
        badge={prices.dataState}
        metric={prices.primaryValue}
        metricLabel={prices.primaryLabel}
        summary={prices.summaryItems.slice(0, 2)}
        title="Energy prices"
        unit="DKK/kWh"
        windowLabel={prices.windowLabel}
      >
        <MobileBarChart color="#4c7cff" labels={prices.pointLabels} unit="DKK/kWh" values={prices.points} />
      </DesktopLikeInsightCard>
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
  return (
    <GlassCard className="overflow-hidden rounded-[28px] p-3">
      <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0b1018]">
        <div className="px-3 pt-3">
          <div className="overflow-hidden rounded-[22px] border border-white/6 bg-[#060b12]">
            <img
              className="h-[148px] w-full object-cover object-center"
              src={assetPath('/mobile-dashboard/image.png')}
              alt="Luxury home with solar roof, battery, EV charger, and Tesla"
            />
          </div>
        </div>

        <div className="grid gap-3 px-3 pb-3 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(96,234,93,0.6)]" />
              Live power
            </span>
            {overview.dataState ? <MobileDataStateBadge badge={overview.dataState} /> : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InfoStat icon="sun" label="Solar output" tone="gold" value={overview.solarPower} />
            <InfoStat icon="grid" label="Grid flow" tone="green" value={overview.gridPower} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricTile icon="home" label="Home" tone="purple" value={overview.homePower} />
            <MetricTile icon="battery" label="Batt." tone="green" value={overview.batteryPower} subValue={battery.soc} />
            <MetricTile icon="grid" label="Grid" tone="blue" value={overview.gridPower} subValue={overview.gridMeta} />
          </div>

        </div>
      </div>
    </GlassCard>
  )
}

function InfoStat({
  icon,
  label,
  tone,
  value,
}: {
  icon: 'grid' | 'sun'
  label: string
  tone: 'gold' | 'green'
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <StatusChip tone={tone === 'green' ? 'green' : 'gold'}>
        <MobileIcon name={icon} />
      </StatusChip>
      <div className="min-w-0">
        <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-dashboard-muted">{label}</span>
        <strong className="block truncate text-[17px] font-semibold leading-none text-dashboard-text">{value}</strong>
      </div>
    </div>
  )
}

function MetricTile({
  icon,
  label,
  subValue,
  tone,
  value,
}: {
  icon: 'battery' | 'grid' | 'home'
  label: string
  subValue?: string
  tone: 'blue' | 'green' | 'purple'
  value: string
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[18px] border px-2.5 py-2.5 shadow-[0_16px_34px_rgba(0,0,0,0.2)] backdrop-blur-md',
        tone === 'green'
          ? 'border-emerald-400/20 bg-emerald-400/[0.08]'
          : tone === 'purple'
            ? 'border-violet-400/20 bg-violet-400/[0.08]'
            : 'border-sky-400/20 bg-sky-400/[0.08]',
      )}
    >
      <div className="grid min-h-[62px] grid-cols-[26px_1fr] gap-x-2 gap-y-1">
        <div className="row-span-2 flex items-start justify-center pt-0.5">
          <div
            className={cn(
              'inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border bg-black/22',
              tone === 'green'
                ? 'border-emerald-400/18 text-emerald-300'
                : tone === 'purple'
                  ? 'border-violet-300/16 text-white/82'
                  : 'border-sky-400/18 text-sky-300',
            )}
          >
            <MobileIcon className="h-3.5 w-3.5" name={icon} />
          </div>
        </div>
        <span className="min-w-0 truncate text-[8px] font-medium uppercase tracking-[0.08em] text-white/52">{label}</span>

        <div className="min-w-0">
          <strong className="block truncate text-[13px] font-semibold leading-none text-white">{value}</strong>
          {subValue ? <small className="mt-1 block truncate text-[10px] leading-none text-white/60">{subValue}</small> : null}
        </div>
      </div>
    </div>
  )
}

function CompactStatusMeta({
  icon,
  label,
  secondary,
  tone,
  value,
}: {
  icon: 'battery' | 'refresh' | 'sun'
  label: string
  secondary: string
  tone: 'blue' | 'gold' | 'green'
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <StatusChip tone={tone === 'green' ? 'green' : tone === 'gold' ? 'gold' : 'neutral'}>
        <MobileIcon className="h-3.5 w-3.5" name={icon} />
      </StatusChip>
      <div className="min-w-0">
        <span className="block text-[8px] font-medium uppercase tracking-[0.08em] text-dashboard-muted">{label}</span>
        <strong className="mt-0.5 block truncate text-[11px] font-semibold text-dashboard-text">{value}</strong>
        <small className="mt-0.5 block truncate text-[9px] leading-4 text-dashboard-soft">{secondary}</small>
      </div>
    </div>
  )
}

function DesktopLikeInsightCard({
  badge,
  children,
  controls,
  metric,
  metricLabel,
  summary,
  title,
  unit,
  windowLabel,
}: {
  badge?: import('../../models/dataState').DataStateBadgeModel
  children: ReactNode
  controls: MobileDashboardProps['insightControls']
  metric: string
  metricLabel: string
  summary: Array<{ label: string; value: string }>
  title: string
  unit: string
  windowLabel: string
}) {
  return (
    <GlassCard className="rounded-[24px] p-4">
      <div className="mb-3 grid gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
          {badge ? <MobileDataStateBadge badge={badge} /> : null}
          <div className="inline-flex min-h-6 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-medium text-dashboard-soft">
            {windowLabel}
          </div>
        </div>
        <MobileInsightControls controls={controls} />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-3 min-[360px]:grid-cols-[minmax(0,1fr)_124px]">
          <div className="grid content-start gap-1">
            <strong className="text-[30px] font-semibold leading-none text-dashboard-text">
              {metric}
              <small className="ml-1 text-[14px] font-semibold text-dashboard-soft">{unit}</small>
            </strong>
            <p className="text-[13px] leading-5 text-dashboard-soft">{metricLabel}</p>
          </div>

          <div className="grid gap-2">
            {summary.map((item) => (
              <div className="rounded-[16px] border border-white/8 bg-[#0a111b]/88 px-3 py-2" key={item.label}>
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{item.label}</span>
                <strong className="mt-1 block text-[12px] font-semibold text-dashboard-text">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-white/8 bg-[#09101a]/72 p-2.5">{children}</div>
      </div>
    </GlassCard>
  )
}
