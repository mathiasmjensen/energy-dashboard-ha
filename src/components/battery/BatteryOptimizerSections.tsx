import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { BatteryOptimizerPlanRow, BatteryOptimizerState } from '../../models/batteryOptimizer'
import { cn } from '../../lib/cn'
import {
  formatOptimizerCurrency,
  formatOptimizerEnergy,
  formatOptimizerHourRange,
  formatOptimizerPercent,
  formatOptimizerPower,
  formatOptimizerPrice,
  formatOptimizerUpdatedAt,
  getOptimizerModeLabel,
  getOptimizerRecommendationTone,
  getOptimizerSourceLabel,
} from '../../services/batteryOptimizerFormatting'
import { slicePlanRows } from '../../services/batteryOptimizer'
import { BarChart, LineChart, OverviewIcon } from '../dashboard/desktop/DesktopShared'
import { GlassCard, MobileBarChart, MobileLineChart, SectionHeading, StatusChip } from '../mobile/MobilePrimitives'

type Variant = 'desktop' | 'mobile'

export function OptimizerStateBanner({ optimizer, variant }: { optimizer: BatteryOptimizerState; variant: Variant }) {
  if (!optimizer.hasLiveError && !optimizer.snapshot) {
    return null
  }

  const isWarning = optimizer.hasLiveError

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-[18px] border px-4 py-3 shadow-glass backdrop-blur-xl',
        variant === 'desktop'
          ? 'border-white/10 bg-white/6'
          : 'dashboard-glass-card border-white/8 bg-white/6 px-4 py-3',
        isWarning ? 'border-amber-400/35 bg-amber-400/10' : 'border-white/10 bg-white/5',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <strong className="text-sm font-semibold text-dashboard-text">
          {optimizer.hasLiveError ? 'Live optimizer unavailable' : 'Optimizer ready'}
        </strong>
        <span className="text-sm leading-5 text-dashboard-soft">
          {optimizer.hasLiveError && optimizer.snapshot
            ? `Showing ${getOptimizerSourceLabel(optimizer.snapshot.source).toLowerCase()} while the backend reconnects.`
            : optimizer.errorMessage ?? 'No optimizer data yet.'}
        </span>
      </div>
      <button
        className="shrink-0 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs font-semibold text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={optimizer.retry}
        disabled={optimizer.isLoading || optimizer.isRefreshing}
      >
        Retry
      </button>
    </div>
  )
}

export function BatteryOptimizerStatusCard({
  optimizer,
  variant,
}: {
  optimizer: BatteryOptimizerState
  variant: Variant
}) {
  if (optimizer.isLoading && !optimizer.snapshot) {
    return <OptimizerLoadingCard title="Battery optimizer status" variant={variant} />
  }

  if (optimizer.isEmpty || !optimizer.snapshot) {
    return <OptimizerEmptyCard title="Battery optimizer status" variant={variant} />
  }

  const { status } = optimizer.snapshot
  const recommendationTone = getOptimizerRecommendationTone(status.recommendation)

  return wrapVariantCard(
    variant,
    'Battery optimizer status',
    <>
      <div className={cn('grid gap-3', variant === 'desktop' ? 'grid-cols-4' : 'grid-cols-2')}>
        <StatusMetric label="Battery SoC" value={formatOptimizerPercent(status.socPercent)} />
        <StatusMetric label="Battery mode" value={getOptimizerModeLabel(status.mode)} />
        <StatusMetric label="Battery power" value={formatOptimizerPower(status.batteryPowerKw)} />
        <StatusMetric label="Grid now" value={formatOptimizerPower(status.gridPowerKw)} />
        <StatusMetric label="Spot price" value={formatOptimizerPrice(status.spotPriceDkkPerKwh)} />
        <StatusMetric label="Full buy price" value={formatOptimizerPrice(status.fullBuyPriceDkkPerKwh)} />
        <StatusMetric label="Sell price" value={formatOptimizerPrice(status.sellPriceDkkPerKwh)} />
        <StatusMetric label="Profit today" value={formatOptimizerCurrency(status.estimatedProfitTodayDkk)} />
      </div>

      <div className={cn('flex items-center gap-3', variant === 'desktop' ? 'flex-wrap justify-between' : 'flex-wrap')}>
        <RecommendationBadge recommendation={status.recommendation} tone={recommendationTone} variant={variant} />
        <div className="flex flex-wrap items-center gap-2 text-xs text-dashboard-soft">
          <small className="text-xs text-dashboard-soft">Updated {formatOptimizerUpdatedAt(status.updatedAt)}</small>
          {optimizer.isStale ? <StaleDataBadge variant={variant} /> : null}
          {optimizer.snapshot.source === 'mock' ? <MockDataBadge variant={variant} /> : null}
        </div>
      </div>
    </>,
  )
}

export function BatteryOptimizerDecisionSummary({
  optimizer,
  variant,
}: {
  optimizer: BatteryOptimizerState
  variant: Variant
}) {
  if (optimizer.isLoading && !optimizer.snapshot) {
    return <OptimizerLoadingCard title="Decision summary" variant={variant} />
  }

  if (optimizer.isEmpty || !optimizer.snapshot) {
    return <OptimizerEmptyCard title="Decision summary" variant={variant} />
  }

  const summary = optimizer.snapshot.decisionSummary

  return wrapVariantCard(
    variant,
    'Decision summary',
    <div className={cn('grid gap-3', variant === 'desktop' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}>
      <SummaryBlock compact={variant === 'desktop'} label="Best hours to sell" value={joinWindowLabels(summary.bestSellHours, variant)} />
      <SummaryBlock compact={variant === 'desktop'} label="Best hours to buy" value={joinWindowLabels(summary.bestBuyHours, variant)} />
      <SummaryBlock compact={variant === 'desktop'} label="Avoid buying" value={joinWindowLabels(summary.avoidBuyHours, variant)} />
      <SummaryBlock compact={variant === 'desktop'} label="Daily arbitrage profit" value={formatOptimizerCurrency(summary.expectedDailyArbitrageProfitDkk)} />
      <SummaryBlock compact={variant === 'desktop'} label="House reserve" value={formatDecisionSummaryText(summary.reserveForHouseUsage, 'reserve', variant)} />
      <SummaryBlock compact={variant === 'desktop'} label="EV charging" value={formatDecisionSummaryText(summary.evChargingRecommendation, 'ev', variant)} />
    </div>,
  )
}

export function BatteryOptimizerControlsCard({
  optimizer,
  variant,
}: {
  optimizer: BatteryOptimizerState
  variant: Variant
}) {
  if (optimizer.isLoading && !optimizer.snapshot) {
    return <OptimizerLoadingCard title="Optimizer controls" variant={variant} />
  }

  if (optimizer.isEmpty || !optimizer.snapshot) {
    return <OptimizerEmptyCard title="Optimizer controls" variant={variant} />
  }

  const settings = optimizer.snapshot.settings
  const isBusy =
    optimizer.isApplyingPlan ||
    optimizer.isLoading ||
    optimizer.isPausing ||
    optimizer.isRefreshing ||
    optimizer.isSavingSettings

  return wrapVariantCard(
    variant,
    'Optimizer controls',
    <>
      <div className={cn('grid gap-3', variant === 'desktop' ? 'grid-cols-3' : 'grid-cols-1')}>
        <ToggleRow
          checked={settings.autoMode}
          disabled={isBusy}
          label="Auto mode"
          onChange={(checked) => optimizer.updateSetting('autoMode', checked)}
          variant={variant}
        />
        <ToggleRow
          checked={settings.dryRun}
          disabled={isBusy}
          label="Dry-run mode"
          onChange={(checked) => optimizer.updateSetting('dryRun', checked)}
          variant={variant}
        />
        <ToggleRow
          checked={settings.allowBatteryExport}
          disabled={isBusy}
          label="Allow battery export"
          onChange={(checked) => optimizer.updateSetting('allowBatteryExport', checked)}
          variant={variant}
        />
        <ToggleRow
          checked={settings.allowGridCharging}
          disabled={isBusy}
          label="Allow grid charging"
          onChange={(checked) => optimizer.updateSetting('allowGridCharging', checked)}
          variant={variant}
        />

        <label className={fieldClassName(variant)}>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-dashboard-muted">Minimum reserve</span>
          <div className="flex items-center gap-3">
            <input
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-dashboard-green"
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.minReservePercent}
              disabled={isBusy}
              aria-label="Minimum reserve percent"
              onChange={(event) => optimizer.updateSetting('minReservePercent', Number(event.target.value))}
            />
            <strong className="whitespace-nowrap text-sm font-semibold text-dashboard-text">{formatOptimizerPercent(settings.minReservePercent)}</strong>
          </div>
        </label>

        <label className={fieldClassName(variant)}>
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-dashboard-muted">Max grid charge</span>
          <div className="flex items-center gap-3">
            <input
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0c121f] px-3 py-2 text-sm text-dashboard-text outline-none transition focus:border-dashboard-blue/55"
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={settings.maxGridChargeKwh}
              disabled={isBusy}
              aria-label="Maximum grid charge kWh"
              onChange={(event) => optimizer.updateSetting('maxGridChargeKwh', Number(event.target.value))}
            />
            <strong className="whitespace-nowrap text-sm font-semibold text-dashboard-text">kWh</strong>
          </div>
        </label>
      </div>

      <div className={cn(variant === 'desktop' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-3')}>
        <button type="button" className={secondaryButtonClassName()} disabled={isBusy} onClick={optimizer.refresh}>
          {optimizer.isRefreshing ? 'Refreshing...' : 'Refresh prices / forecast'}
        </button>
        <button type="button" className={secondaryButtonClassName()} disabled={isBusy} onClick={optimizer.pauseUntilTomorrow}>
          {optimizer.isPausing ? 'Pausing...' : 'Pause until tomorrow'}
        </button>
        <button type="button" className={primaryButtonClassName()} disabled={isBusy} onClick={optimizer.applyPlan}>
          {optimizer.isApplyingPlan ? 'Applying plan...' : 'Apply optimized plan'}
        </button>
      </div>
    </>,
  )
}

export function BatteryOptimizerPlanTable({
  optimizer,
  planHours,
  variant,
}: {
  optimizer: BatteryOptimizerState
  planHours: number
  variant: Variant
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const rows = optimizer.snapshot ? slicePlanRows(optimizer.snapshot.planRows, planHours) : []
  const visibleRows = variant === 'desktop' ? (isExpanded ? rows.slice(0, 12) : rows.slice(0, 6)) : rows
  const hiddenCount = Math.max(0, rows.length - visibleRows.length)
  const planSummary = getPlanSummary(rows)

  if (optimizer.isLoading && !optimizer.snapshot) {
    return <OptimizerLoadingCard title="Optimization plan" variant={variant} />
  }

  if (optimizer.isEmpty || !optimizer.snapshot) {
    return <OptimizerEmptyCard title="Optimization plan" variant={variant} />
  }

  if (variant === 'mobile') {
    return (
      <GlassCard className="dashboard-glass-card flex flex-col gap-4 rounded-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading title="Optimization plan" />
          <div className={planPillClassName()}>{planHours}h horizon</div>
        </div>

        <div className="flex flex-col gap-3" aria-label="Battery optimization plan">
          {rows.map((row) => (
            <article className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)]" key={row.startIso}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong className="text-sm font-semibold text-dashboard-text">{formatOptimizerHourRange(row)}</strong>
                <OptimizerPlanActionChip action={row.action} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <PlanMiniStat label="Spot" value={formatOptimizerPrice(row.spotPriceDkkPerKwh)} />
                <PlanMiniStat label="Buy" value={formatOptimizerPrice(row.fullBuyPriceDkkPerKwh)} />
                <PlanMiniStat label="Sell" value={formatOptimizerPrice(row.sellPriceDkkPerKwh)} />
                <PlanMiniStat label="Solar" value={formatOptimizerEnergy(row.expectedSolarSurplusKwh)} />
                <PlanMiniStat label="House" value={formatOptimizerEnergy(row.expectedHouseUsageKwh)} />
                <PlanMiniStat label="Target" value={formatOptimizerPercent(row.targetSocPercent)} />
                <PlanMiniStat label="Profit" value={formatOptimizerCurrency(row.expectedProfitDkk)} />
              </div>
            </article>
          ))}
        </div>
      </GlassCard>
    )
  }

  return (
    <section className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-dashboard-text">Optimization plan</h3>
        <div className={planPillClassName()}>{planHours}h horizon</div>
      </div>

      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <SummaryBlock compact label="Next action" value={planSummary.nextAction} />
          <SummaryBlock compact label="Best projected window" value={planSummary.bestWindow} />
          <SummaryBlock compact label="Projected plan result" value={planSummary.projectedProfit} />
          <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] sm:col-span-2 xl:col-span-1">
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">How to read</span>
            <div className="mt-3 flex flex-wrap gap-2">
              <OptimizerPlanActionChip action="BUY" />
              <OptimizerPlanActionChip action="CHARGE" />
              <OptimizerPlanActionChip action="HOLD" />
              <OptimizerPlanActionChip action="DISCHARGE" />
              <OptimizerPlanActionChip action="SELL" />
            </div>
            <p className="mt-3 text-[12px] leading-5 text-dashboard-soft">
              Rows are ordered by time. Target shows where the optimizer wants battery state of charge to land by the end of that hour.
            </p>
          </div>
          <div className="grid gap-2 rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)] sm:col-span-2 sm:grid-cols-3 xl:col-span-1 xl:grid-cols-1">
            <PlanMiniStat
              label="Highest sell price"
              value={rows.length ? formatOptimizerPrice(Math.max(...rows.map((row) => row.sellPriceDkkPerKwh))) : '---'}
            />
            <PlanMiniStat
              label="Lowest spot price"
              value={rows.length ? formatOptimizerPrice(Math.min(...rows.map((row) => row.spotPriceDkkPerKwh))) : '---'}
            />
            <PlanMiniStat
              label="Avg target SoC"
              value={
                rows.length
                  ? formatOptimizerPercent(rows.reduce((sum, row) => sum + row.targetSocPercent, 0) / rows.length)
                  : '---'
              }
            />
          </div>
        </aside>

        <div className="flex min-h-0 flex-col gap-3">
          <div className="grid grid-cols-[110px_88px_88px_88px_82px_82px_minmax(90px,1fr)] items-center gap-2 rounded-[16px] border border-white/8 bg-white/[0.035] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-dashboard-muted">
            <span>Time</span>
            <span>Action</span>
            <span>Spot</span>
            <span>Target</span>
            <span>Solar</span>
            <span>House</span>
            <span className="text-right">Profit</span>
          </div>

          <div aria-label="Battery optimization plan">
            <div className="grid gap-2">
            {visibleRows.map((row) => (
              <article
                key={row.startIso}
                className="grid grid-cols-[110px_88px_88px_88px_82px_82px_minmax(90px,1fr)] items-center gap-2 rounded-[16px] border border-white/8 bg-[#0b111d]/88 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
              >
                <div className="min-w-0">
                  <strong className="block truncate text-[0.84rem] font-semibold text-dashboard-text">{formatOptimizerHourRange(row)}</strong>
                  <span className="mt-0.5 block truncate text-[0.72rem] text-dashboard-soft">Buy {formatOptimizerPrice(row.fullBuyPriceDkkPerKwh)}</span>
                </div>
                <OptimizerPlanActionChip action={row.action} />
                <strong className="text-[0.82rem] font-semibold text-dashboard-text">{formatOptimizerPrice(row.spotPriceDkkPerKwh)}</strong>
                <strong className="text-[0.82rem] font-semibold text-dashboard-text">{formatOptimizerPercent(row.targetSocPercent)}</strong>
                <span className="text-[0.8rem] text-dashboard-soft">{formatOptimizerEnergy(row.expectedSolarSurplusKwh)}</span>
                <span className="text-[0.8rem] text-dashboard-soft">{formatOptimizerEnergy(row.expectedHouseUsageKwh)}</span>
                <strong className="text-right text-[0.82rem] font-semibold text-dashboard-text">{formatOptimizerCurrency(row.expectedProfitDkk)}</strong>
              </article>
            ))}
            </div>
          </div>

          {hiddenCount > 0 ? (
            <div className="flex justify-center">
              <button
                type="button"
                className={secondaryButtonClassName()}
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? 'Show fewer plan hours' : `Show ${hiddenCount} more plan hours`}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function BatteryOptimizerCharts({
  optimizer,
  variant,
}: {
  optimizer: BatteryOptimizerState
  variant: Variant
}) {
  if (optimizer.isLoading && !optimizer.snapshot) {
    return <OptimizerLoadingCard title="Optimizer charts" variant={variant} />
  }

  if (optimizer.isEmpty || !optimizer.snapshot) {
    return <OptimizerEmptyCard title="Optimizer charts" variant={variant} />
  }

  const charts = optimizer.snapshot.charts

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4">
        <OptimizerMobileChartCard color="#3d86ff" labels={charts.priceCurve.labels} points={charts.priceCurve.points} title="DK1 price curve" unit="DKK/kWh" />
        <OptimizerMobileChartCard color="#60ea5d" labels={charts.socForecast.labels} points={charts.socForecast.points} title="Battery SoC forecast" unit="%" />
        <OptimizerMobileChartCard color="#f0b339" labels={charts.plannedBatteryPower.labels} points={charts.plannedBatteryPower.points} title="Planned charge / discharge" unit="kWh" />
        <OptimizerMobileChartCard color="#c98cff" labels={charts.profitByHour.labels} points={charts.profitByHour.points} title="Expected profit by hour" unit="DKK/kWh" />
      </div>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-4">
      <OptimizerDesktopChartCard color="#3d86ff" labels={charts.priceCurve.labels} points={charts.priceCurve.points} title="DK1 price curve" unit="DKK/kWh" />
      <OptimizerDesktopChartCard color="#60ea5d" labels={charts.socForecast.labels} points={charts.socForecast.points} title="Battery SoC forecast" unit="%" />
      <OptimizerDesktopChartCard color="#f0b339" labels={charts.plannedBatteryPower.labels} points={charts.plannedBatteryPower.points} title="Planned charge / discharge" unit="kW" />
      <OptimizerDesktopChartCard color="#c98cff" labels={charts.profitByHour.labels} points={charts.profitByHour.points} title="Expected profit by hour" unit="DKK/kWh" />
    </section>
  )
}

function OptimizerDesktopChartCard({
  color,
  labels,
  points,
  title,
  unit,
}: {
  color: string
  labels: string[]
  points: number[]
  title: string
  unit: '%' | 'DKK/kWh' | 'kW'
}) {
  return (
    <section className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-dashboard-text">{title}</h3>
      </div>
      <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-3">
        {unit === 'kW' ? (
          <BarChart className="min-h-[188px] insight-bar-chart" label={title} labels={labels} unit="kW" values={points} />
        ) : unit === '%' ? (
          <LineChart
            className="min-h-[188px] insight-line-chart"
            color={color}
            label={title}
            labels={labels}
            points={points}
            unit="%"
          />
        ) : (
          <BarChart
            className="min-h-[188px] insight-bar-chart insight-bar-chart--prices"
            label={title}
            labels={labels}
            unit="DKK/kWh"
            values={points}
          />
        )}
      </div>
    </section>
  )
}

function OptimizerMobileChartCard({
  color,
  labels,
  points,
  title,
  unit,
}: {
  color: string
  labels: string[]
  points: number[]
  title: string
  unit: '%' | 'DKK/kWh' | 'kWh'
}) {
  return (
    <GlassCard className="dashboard-glass-card flex flex-col gap-4 rounded-panel p-4">
      <SectionHeading title={title} />
      {unit === '%' ? (
        <MobileLineChart color={color} labels={labels} points={points} unit="%" />
      ) : (
        <MobileBarChart color={color} labels={labels} unit={unit === 'DKK/kWh' ? 'DKK/kWh' : 'kWh'} values={points} />
      )}
    </GlassCard>
  )
}

function SummaryBlock({
  compact = false,
  label,
  value,
}: {
  compact?: boolean
  label: string
  value: string
}) {
  return (
    <div className={cn('rounded-[18px] border border-white/8 bg-[#0b111d]/88 shadow-[0_12px_28px_rgba(0,0,0,0.18)]', compact ? 'p-2.5' : 'p-4')}>
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <strong
        className={cn(
          'mt-2 block font-semibold text-dashboard-text',
          compact ? 'text-[0.84rem] leading-5' : 'text-[1rem] leading-7',
        )}
        style={
          compact
            ? ({
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3,
                display: '-webkit-box',
                overflow: 'hidden',
              } as CSSProperties)
            : undefined
        }
      >
        {value}
      </strong>
    </div>
  )
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[88px] rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-3 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <strong className="mt-2 block break-words text-[0.96rem] font-semibold leading-5 text-dashboard-text">{value}</strong>
    </div>
  )
}

function PlanMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] px-2 py-2">
      <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-dashboard-muted">{label}</span>
      <strong className="mt-1 block break-words text-[0.84rem] font-semibold leading-5 text-dashboard-text">{value}</strong>
    </div>
  )
}

function ToggleRow({
  checked,
  disabled,
  label,
  onChange,
  variant,
}: {
  checked: boolean
  disabled: boolean
  label: string
  onChange: (checked: boolean) => void
  variant: Variant
}) {
  return (
    <label className={fieldClassName(variant)}>
      <span className="text-sm font-medium text-dashboard-text">{label}</span>
      <input
        className="h-5 w-5 rounded border-white/15 bg-[#0c121f] text-dashboard-blue accent-dashboard-blue"
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

function RecommendationBadge({
  recommendation,
  tone,
  variant,
}: {
  recommendation: string
  tone: 'blue' | 'gold' | 'green' | 'neutral' | 'purple'
  variant: Variant
}) {
  if (variant === 'mobile') {
    return <StatusChip tone={mapToneToMobile(tone)}>{recommendation}</StatusChip>
  }

  return <div className={badgeClassName(tone)}>{recommendation}</div>
}

function OptimizerPlanActionChip({ action }: { action: string }) {
  return <div className={badgeClassName(getOptimizerRecommendationTone(action as never))}>{action}</div>
}

function StaleDataBadge({ variant }: { variant: Variant }) {
  return (
    <div className={dataBadgeClassName(variant, 'stale')}>Stale</div>
  )
}

function MockDataBadge({ variant }: { variant: Variant }) {
  return (
    <div className={dataBadgeClassName(variant, 'mock')}>Mock</div>
  )
}

function OptimizerLoadingCard({ title, variant }: { title: string; variant: Variant }) {
  return wrapVariantCard(
    variant,
    title,
    <div className="flex min-h-[164px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-white/10 bg-[#0b111d]/88 px-6 py-8 text-center">
      <OverviewIcon name="history" />
      <strong className="text-base font-semibold text-dashboard-text">Loading optimizer...</strong>
      <span className="max-w-[26rem] text-sm leading-5 text-dashboard-soft">Fetching status, plan, and settings.</span>
    </div>,
  )
}

function OptimizerEmptyCard({ title, variant }: { title: string; variant: Variant }) {
  return wrapVariantCard(
    variant,
    title,
    <div className="flex min-h-[164px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-white/10 bg-[#0b111d]/88 px-6 py-8 text-center">
      <OverviewIcon name="battery" />
      <strong className="text-base font-semibold text-dashboard-text">No optimizer data</strong>
      <span className="max-w-[26rem] text-sm leading-5 text-dashboard-soft">Plan and settings will appear here once the optimizer responds.</span>
    </div>,
  )
}

function wrapVariantCard(variant: Variant, title: string, body: ReactNode) {
  if (variant === 'mobile') {
    return (
      <GlassCard className="dashboard-glass-card flex flex-col gap-4 rounded-panel p-4">
        <SectionHeading title={title} />
        {body}
      </GlassCard>
    )
  }

  return (
    <section className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-dashboard-text">{title}</h3>
      </div>
      {body}
    </section>
  )
}

function joinWindowLabels(labels: string[], variant: Variant) {
  if (!labels.length) {
    return 'No strong window identified'
  }

  if (variant === 'desktop' && labels.length > 4) {
    return `${labels.slice(0, 4).join(', ')} +${labels.length - 4}`
  }

  return labels.join(', ')
}

function formatDecisionSummaryText(value: string, type: 'ev' | 'reserve', variant: Variant) {
  if (variant !== 'desktop') {
    return value
  }

  const normalized = value.trim()

  if (type === 'reserve') {
    return normalized
      .replace('Reserve battery for house usage through the next expensive window.', 'Keep reserve for house through next expensive window.')
      .replace('Enough headroom to trade while keeping house reserve.', 'Enough headroom to trade while keeping reserve.')
  }

  return normalized
    .replace('Wait for the cheaper grid window unless strong solar surplus appears first.', 'Wait for cheaper grid window unless strong solar surplus appears.')
    .replace('Prefer solar charging until lower prices arrive.', 'Prefer solar charging until lower prices arrive.')
}

function getPlanSummary(rows: BatteryOptimizerPlanRow[]) {
  const nextRow = rows[0]
  const bestRow = rows.reduce<typeof nextRow | null>((best, row) => {
    if (!best || row.expectedProfitDkk > best.expectedProfitDkk) {
      return row
    }

    return best
  }, null)
  const totalProfit = rows.reduce((sum, row) => sum + row.expectedProfitDkk, 0)

  return {
    bestWindow: bestRow ? `${formatOptimizerHourRange(bestRow)} · ${bestRow.action}` : 'No strong window identified',
    nextAction: nextRow ? `${nextRow.action} · ${formatOptimizerHourRange(nextRow)}` : 'No plan available',
    projectedProfit: formatOptimizerCurrency(totalProfit),
  }
}

function mapToneToMobile(tone: 'blue' | 'gold' | 'green' | 'neutral' | 'purple') {
  if (tone === 'gold') {
    return 'gold' as const
  }
  if (tone === 'green') {
    return 'green' as const
  }
  if (tone === 'neutral') {
    return 'neutral' as const
  }
  return 'danger' as const
}

function fieldClassName(variant: Variant) {
  return cn(
    'flex rounded-[18px] border border-white/8 bg-[#0b111d]/88 shadow-[0_12px_28px_rgba(0,0,0,0.18)]',
    variant === 'desktop' ? 'items-center justify-between gap-2.5 p-2.5' : 'flex-col gap-3 p-3',
  )
}

function secondaryButtonClassName() {
  return 'inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-[0.82rem] font-semibold text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
}

function primaryButtonClassName() {
  return 'inline-flex min-h-10 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(77,122,255,0.98),rgba(86,231,112,0.88))] px-3.5 py-2.5 text-[0.82rem] font-semibold text-slate-950 shadow-[0_18px_40px_rgba(77,122,255,0.28)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50'
}

function planPillClassName() {
  return 'inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dashboard-soft'
}

function badgeClassName(tone: 'blue' | 'gold' | 'green' | 'neutral' | 'purple') {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-400/30 bg-emerald-400/12 text-emerald-200'
      : tone === 'gold'
        ? 'border-amber-400/30 bg-amber-400/12 text-amber-200'
        : tone === 'blue'
          ? 'border-sky-400/30 bg-sky-400/12 text-sky-200'
          : tone === 'purple'
            ? 'border-violet-400/30 bg-violet-400/12 text-violet-200'
            : 'border-white/15 bg-white/8 text-dashboard-soft'

  return cn(
    'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
    toneClass,
  )
}

function dataBadgeClassName(variant: Variant, type: 'stale' | 'mock') {
  return cn(
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
    variant === 'desktop' ? '' : '',
    type === 'stale'
      ? 'border-amber-400/30 bg-amber-400/12 text-amber-200'
      : 'border-sky-400/30 bg-sky-400/12 text-sky-200',
  )
}
