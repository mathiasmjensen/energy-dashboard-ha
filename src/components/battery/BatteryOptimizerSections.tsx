import type { ReactNode } from 'react'
import type { BatteryOptimizerState } from '../../hooks/useBatteryOptimizer'
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

  const className = variant === 'desktop' ? 'optimizer-banner optimizer-banner--desktop' : 'optimizer-banner optimizer-banner--mobile'

  return (
    <div className={className} data-tone={optimizer.hasLiveError ? 'warning' : 'neutral'}>
      <div>
        <strong>{optimizer.hasLiveError ? 'Live optimizer unavailable' : 'Optimizer ready'}</strong>
        <span>
          {optimizer.hasLiveError && optimizer.snapshot
            ? `Showing ${getOptimizerSourceLabel(optimizer.snapshot.source).toLowerCase()} while the backend reconnects.`
            : optimizer.errorMessage ?? 'No optimizer data yet.'}
        </span>
      </div>
      <button type="button" onClick={optimizer.retry} disabled={optimizer.isLoading || optimizer.isRefreshing}>
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
      <div className={`optimizer-status-grid optimizer-status-grid--${variant}`}>
        <StatusMetric label="Battery SoC" value={formatOptimizerPercent(status.socPercent)} />
        <StatusMetric label="Battery mode" value={getOptimizerModeLabel(status.mode)} />
        <StatusMetric label="Battery power" value={formatOptimizerPower(status.batteryPowerKw)} />
        <StatusMetric label="Grid now" value={formatOptimizerPower(status.gridPowerKw)} />
        <StatusMetric label="Spot price" value={formatOptimizerPrice(status.spotPriceDkkPerKwh)} />
        <StatusMetric label="Full buy price" value={formatOptimizerPrice(status.fullBuyPriceDkkPerKwh)} />
        <StatusMetric label="Sell price" value={formatOptimizerPrice(status.sellPriceDkkPerKwh)} />
        <StatusMetric label="Profit today" value={formatOptimizerCurrency(status.estimatedProfitTodayDkk)} />
      </div>

      <div className={`optimizer-status-foot optimizer-status-foot--${variant}`}>
        <RecommendationBadge recommendation={status.recommendation} tone={recommendationTone} variant={variant} />
        <div className="optimizer-status-meta">
          <small>Updated {formatOptimizerUpdatedAt(status.updatedAt)}</small>
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
    <div className={`optimizer-summary-grid optimizer-summary-grid--${variant}`}>
      <SummaryBlock label="Best hours to sell" value={joinWindowLabels(summary.bestSellHours)} />
      <SummaryBlock label="Best hours to buy" value={joinWindowLabels(summary.bestBuyHours)} />
      <SummaryBlock label="Avoid buying" value={joinWindowLabels(summary.avoidBuyHours)} />
      <SummaryBlock label="Daily arbitrage profit" value={formatOptimizerCurrency(summary.expectedDailyArbitrageProfitDkk)} />
      <SummaryBlock label="House reserve" value={summary.reserveForHouseUsage} />
      <SummaryBlock label="EV charging" value={summary.evChargingRecommendation} />
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
      <div className={`optimizer-controls-grid optimizer-controls-grid--${variant}`}>
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

        <label className={`optimizer-field optimizer-field--${variant}`}>
          <span>Minimum reserve</span>
          <div className="optimizer-slider-field">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.minReservePercent}
              disabled={isBusy}
              aria-label="Minimum reserve percent"
              onChange={(event) => optimizer.updateSetting('minReservePercent', Number(event.target.value))}
            />
            <strong>{formatOptimizerPercent(settings.minReservePercent)}</strong>
          </div>
        </label>

        <label className={`optimizer-field optimizer-field--${variant}`}>
          <span>Max grid charge</span>
          <div className="optimizer-number-field">
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={settings.maxGridChargeKwh}
              disabled={isBusy}
              aria-label="Maximum grid charge kWh"
              onChange={(event) => optimizer.updateSetting('maxGridChargeKwh', Number(event.target.value))}
            />
            <strong>kWh</strong>
          </div>
        </label>
      </div>

      <div className={`optimizer-action-row optimizer-action-row--${variant}`}>
        <button type="button" className="optimizer-secondary-button" disabled={isBusy} onClick={optimizer.refresh}>
          {optimizer.isRefreshing ? 'Refreshing...' : 'Refresh prices / forecast'}
        </button>
        <button type="button" className="optimizer-secondary-button" disabled={isBusy} onClick={optimizer.pauseUntilTomorrow}>
          {optimizer.isPausing ? 'Pausing...' : 'Pause until tomorrow'}
        </button>
        <button type="button" className="optimizer-primary-button" disabled={isBusy} onClick={optimizer.applyPlan}>
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
  if (optimizer.isLoading && !optimizer.snapshot) {
    return <OptimizerLoadingCard title="Optimization plan" variant={variant} />
  }

  if (optimizer.isEmpty || !optimizer.snapshot) {
    return <OptimizerEmptyCard title="Optimization plan" variant={variant} />
  }

  const rows = slicePlanRows(optimizer.snapshot.planRows, planHours)

  if (variant === 'mobile') {
    return (
      <GlassCard className="mobile-section-card optimizer-mobile-plan-card">
        <div className="mobile-card-stack">
          <SectionHeading title="Optimization plan" />
          <div className="optimizer-plan-pill">{planHours}h horizon</div>
        </div>

        <div className="optimizer-mobile-plan-list" aria-label="Battery optimization plan">
          {rows.map((row) => (
            <article className="optimizer-mobile-plan-item" key={row.startIso}>
              <div className="optimizer-mobile-plan-item__row">
                <strong>{formatOptimizerHourRange(row)}</strong>
                <OptimizerPlanActionChip action={row.action} />
              </div>
              <div className="optimizer-mobile-plan-item__metrics">
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
    <section className="battery-modal__optimizer-card battery-modal__optimizer-card--wide">
      <div className="battery-modal__optimizer-header">
        <h3>Optimization plan</h3>
        <div className="optimizer-plan-pill">{planHours}h horizon</div>
      </div>

      <div className="optimizer-plan-table-wrap">
        <table className="optimizer-plan-table">
          <thead>
            <tr>
              <th>Hour</th>
              <th>Spot</th>
              <th>Full buy</th>
              <th>Sell</th>
              <th>Solar surplus</th>
              <th>House usage</th>
              <th>Target SoC</th>
              <th>Action</th>
              <th>Profit / loss</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.startIso}>
                <td>{formatOptimizerHourRange(row)}</td>
                <td>{formatOptimizerPrice(row.spotPriceDkkPerKwh)}</td>
                <td>{formatOptimizerPrice(row.fullBuyPriceDkkPerKwh)}</td>
                <td>{formatOptimizerPrice(row.sellPriceDkkPerKwh)}</td>
                <td>{formatOptimizerEnergy(row.expectedSolarSurplusKwh)}</td>
                <td>{formatOptimizerEnergy(row.expectedHouseUsageKwh)}</td>
                <td>{formatOptimizerPercent(row.targetSocPercent)}</td>
                <td>
                  <OptimizerPlanActionChip action={row.action} />
                </td>
                <td>{formatOptimizerCurrency(row.expectedProfitDkk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
      <div className="optimizer-mobile-charts">
        <OptimizerMobileChartCard color="#3d86ff" labels={charts.priceCurve.labels} points={charts.priceCurve.points} title="DK1 price curve" unit="DKK/kWh" />
        <OptimizerMobileChartCard color="#60ea5d" labels={charts.socForecast.labels} points={charts.socForecast.points} title="Battery SoC forecast" unit="%" />
        <OptimizerMobileChartCard color="#f0b339" labels={charts.plannedBatteryPower.labels} points={charts.plannedBatteryPower.points} title="Planned charge / discharge" unit="kWh" />
        <OptimizerMobileChartCard color="#c98cff" labels={charts.profitByHour.labels} points={charts.profitByHour.points} title="Expected profit by hour" unit="DKK/kWh" />
      </div>
    )
  }

  return (
    <section className="battery-modal__optimizer-charts">
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
    <section className="battery-modal__optimizer-card">
      <div className="battery-modal__optimizer-header">
        <h3>{title}</h3>
      </div>
      <div className="insight-chart-shell optimizer-chart-shell">
        {unit === 'kW' ? (
          <BarChart className="optimizer-desktop-chart insight-bar-chart" label={title} labels={labels} unit="kW" values={points} />
        ) : unit === '%' ? (
          <LineChart
            className="optimizer-desktop-line-chart insight-line-chart"
            color={color}
            label={title}
            labels={labels}
            points={points}
            unit="%"
          />
        ) : (
          <BarChart
            className="optimizer-desktop-chart insight-bar-chart insight-bar-chart--prices"
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
    <GlassCard className="mobile-section-card optimizer-mobile-chart-card">
      <SectionHeading title={title} />
      {unit === '%' ? (
        <MobileLineChart color={color} labels={labels} points={points} unit="%" />
      ) : (
        <MobileBarChart color={color} labels={labels} unit={unit === 'DKK/kWh' ? 'DKK/kWh' : 'kWh'} values={points} />
      )}
    </GlassCard>
  )
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="optimizer-summary-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="optimizer-status-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PlanMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="optimizer-plan-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
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
    <label className={`optimizer-toggle-row optimizer-toggle-row--${variant}`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
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

  return <div className="optimizer-recommendation-badge" data-tone={tone}>{recommendation}</div>
}

function OptimizerPlanActionChip({ action }: { action: string }) {
  return <div className="optimizer-plan-action-chip" data-tone={getOptimizerRecommendationTone(action as never)}>{action}</div>
}

function StaleDataBadge({ variant }: { variant: Variant }) {
  return (
    <div className={`optimizer-data-badge optimizer-data-badge--stale optimizer-data-badge--${variant}`}>
      Stale
    </div>
  )
}

function MockDataBadge({ variant }: { variant: Variant }) {
  return (
    <div className={`optimizer-data-badge optimizer-data-badge--mock optimizer-data-badge--${variant}`}>
      Mock
    </div>
  )
}

function OptimizerLoadingCard({ title, variant }: { title: string; variant: Variant }) {
  return wrapVariantCard(
    variant,
    title,
    <div className="optimizer-placeholder">
      <OverviewIcon name="history" />
      <strong>Loading optimizer...</strong>
      <span>Fetching status, plan, and settings.</span>
    </div>,
  )
}

function OptimizerEmptyCard({ title, variant }: { title: string; variant: Variant }) {
  return wrapVariantCard(
    variant,
    title,
    <div className="optimizer-placeholder">
      <OverviewIcon name="battery" />
      <strong>No optimizer data</strong>
      <span>Plan and settings will appear here once the optimizer responds.</span>
    </div>,
  )
}

function wrapVariantCard(variant: Variant, title: string, body: ReactNode) {
  if (variant === 'mobile') {
    return (
      <GlassCard className="mobile-section-card optimizer-mobile-card">
        <SectionHeading title={title} />
        {body}
      </GlassCard>
    )
  }

  return (
    <section className="battery-modal__optimizer-card">
      <div className="battery-modal__optimizer-header">
        <h3>{title}</h3>
      </div>
      {body}
    </section>
  )
}

function joinWindowLabels(labels: string[]) {
  return labels.length ? labels.join(', ') : 'No strong window identified'
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
