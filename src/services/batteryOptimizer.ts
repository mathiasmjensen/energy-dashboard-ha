import type {
  BatteryOptimizerNormalizedSnapshotPayloads,
  BatteryOptimizerApiSettingsPayload,
  BatteryOptimizerChartSeries,
  BatteryOptimizerCharts,
  BatteryOptimizerDecisionSummary,
  BatteryOptimizerLiveInputs,
  BatteryOptimizerMode,
  BatteryOptimizerMockSnapshotOptions,
  BatteryOptimizerPlanRow,
  BatteryOptimizerRecommendation,
  BatteryOptimizerSettings,
  BatteryOptimizerSnapshot,
} from '../models/batteryOptimizer'
import type { PeakRateDay, PeakRateHour } from '../models/peakRates'
import type { SolarForecastWindow } from '../models/solarForecast'
import { isProductionBuild, resolveBrowserVisibleUrl } from './runtimeSecurity'

const STALE_MS = 30 * 60 * 1000

export function getBatteryOptimizerMode() {
  const configured = getEnvValue('VITE_BATTERY_OPTIMIZER_MODE')?.trim().toLowerCase()

  if (configured === 'mock' || configured === 'direct-api' || configured === 'ha-proxy') {
    if (configured === 'direct-api' && isProductionBuild() && !getBatteryOptimizerBaseUrl()) {
      return 'ha-proxy' as const
    }
    return configured
  }

  return 'mock' as const
}

export function getBatteryOptimizerBaseUrl() {
  const configured = getEnvValue('VITE_BATTERY_OPTIMIZER_BASE_URL')?.trim()
  return configured ? resolveBrowserVisibleUrl(configured) : ''
}

export function isBatteryOptimizerStale(updatedAt: string, nowMs = Date.now()) {
  const updatedMs = Date.parse(updatedAt)
  return !Number.isFinite(updatedMs) || nowMs - updatedMs > STALE_MS
}

export function createMockBatteryOptimizerSnapshot(
  inputs: BatteryOptimizerLiveInputs,
  options?: BatteryOptimizerMockSnapshotOptions,
): BatteryOptimizerSnapshot {
  const nowMs = options?.nowMs ?? Date.now()
  const updatedAt = new Date(nowMs - (options?.stale ? 45 : 8) * 60 * 1000).toISOString()
  const peakHours = getUpcomingPeakHours(inputs.peakRateDays, nowMs, 48)
  const forecastByHour = getForecastByHour(inputs.solarForecastWindows)
  const spotPrices = peakHours.length ? peakHours : createSyntheticPriceHours(nowMs, 48, inputs.currentPriceDkkPerKwh ?? 1.55)
  const spotValues = spotPrices.map((hour) => hour.price)
  const cheapThreshold = percentile(spotValues, 0.28)
  const expensiveThreshold = percentile(spotValues, 0.78)
  const baseSoc = clamp(inputs.batterySocPercent ?? 62, 5, 98)
  let rollingSoc = baseSoc

  const planRows = spotPrices.map<BatteryOptimizerPlanRow>((hour, index) => {
    const expectedHouseUsageKwh = getMockHouseUsage(hour.startIso)
    const expectedSolarSurplusKwh = roundNumber(forecastByHour.get(hour.startIso.slice(0, 13)) ?? 0)
    const fullBuyPriceDkkPerKwh = roundNumber(hour.price + 0.42)
    const sellPriceDkkPerKwh = roundNumber(Math.max(hour.price - 0.16, 0.02))
    const action = decideMockAction({
      allowBatteryExport: true,
      allowGridCharging: true,
      cheapThreshold,
      expensiveThreshold,
      expectedSolarSurplusKwh,
      fullBuyPriceDkkPerKwh,
      index,
      rollingSoc,
      sellPriceDkkPerKwh,
      spotPriceDkkPerKwh: hour.price,
    })
    const expectedProfitDkk = getExpectedProfit({
      action,
      expectedHouseUsageKwh,
      expectedSolarSurplusKwh,
      fullBuyPriceDkkPerKwh,
      sellPriceDkkPerKwh,
      spotPriceDkkPerKwh: hour.price,
    })

    rollingSoc = clamp(
      rollingSoc +
        (action === 'BUY' || action === 'CHARGE' ? 8 : 0) -
        (action === 'DISCHARGE' ? 6 : 0) -
        (action === 'SELL' ? 10 : 0),
      12,
      98,
    )

    return {
      action,
      endIso: hour.endIso,
      expectedHouseUsageKwh,
      expectedProfitDkk,
      expectedSolarSurplusKwh,
      fullBuyPriceDkkPerKwh,
      sellPriceDkkPerKwh,
      spotPriceDkkPerKwh: hour.price,
      startIso: hour.startIso,
      targetSocPercent: roundNumber(rollingSoc, 0),
    }
  })

  const currentRow = planRows.find((row) => {
    const startMs = Date.parse(row.startIso)
    const endMs = Date.parse(row.endIso)
    return startMs <= nowMs && nowMs < endMs
  }) ?? planRows[0]

  const summary = deriveDecisionSummary(planRows)
  const settings: BatteryOptimizerSettings = {
    allowBatteryExport: true,
    allowGridCharging: true,
    autoMode: true,
    dryRun: true,
    maxGridChargeKwh: 8.5,
    minReservePercent: 22,
    pausedUntil: null,
  }

  return {
    charts: deriveCharts(planRows),
    decisionSummary: {
      ...summary,
      evChargingRecommendation: summary.bestBuyHours.length
        ? 'Wait for the cheaper grid window unless strong solar surplus appears first.'
        : 'Prefer solar charging until lower prices arrive.',
      reserveForHouseUsage:
        currentRow.targetSocPercent <= settings.minReservePercent + 8
          ? 'Reserve battery for house usage through the next expensive window.'
          : 'Enough headroom to trade while keeping house reserve.',
    },
    planRows,
    settings,
    source: 'mock',
    status: {
      batteryPowerKw: roundNumber(inputs.batteryPowerKw ?? 0),
      estimatedProfitTodayDkk: summary.expectedDailyArbitrageProfitDkk,
      fullBuyPriceDkkPerKwh: currentRow.fullBuyPriceDkkPerKwh,
      gridPowerKw: roundNumber(inputs.gridPowerKw ?? 0),
      mode: mapBatteryMode(inputs.batteryStatus, true),
      recommendation: currentRow.action,
      sellPriceDkkPerKwh: currentRow.sellPriceDkkPerKwh,
      socPercent: roundNumber(inputs.batterySocPercent ?? baseSoc, 0),
      spotPriceDkkPerKwh: currentRow.spotPriceDkkPerKwh,
      updatedAt,
    },
  }
}

export function normalizeBatteryOptimizerSnapshot({
  inputs,
  planPayload,
  settingsPayload,
  source,
  statusPayload,
}: BatteryOptimizerNormalizedSnapshotPayloads): BatteryOptimizerSnapshot {
  const fallback = createMockBatteryOptimizerSnapshot(inputs)
  const rawRows = normalizePlanRows(planPayload.rows)
  const planRows = rawRows.length ? rawRows : fallback.planRows
  const decisionSummary = normalizeDecisionSummary(planPayload.decisionSummary, planRows, fallback.decisionSummary)
  const settings = normalizeSettings(settingsPayload, fallback.settings)
  const charts = normalizeCharts(planPayload.charts, planRows, fallback.charts)
  const updatedAt = statusPayload.updatedAt || planPayload.updatedAt || fallback.status.updatedAt

  return {
    charts,
    decisionSummary,
    planRows,
    settings,
    source,
    status: {
      batteryPowerKw: roundNumber(inputs.batteryPowerKw ?? parseMaybeNumber(statusPayload.batteryPowerKw) ?? fallback.status.batteryPowerKw),
      estimatedProfitTodayDkk: roundNumber(parseMaybeNumber(statusPayload.estimatedProfitTodayDkk) ?? decisionSummary.expectedDailyArbitrageProfitDkk),
      fullBuyPriceDkkPerKwh: roundNumber(parseMaybeNumber(statusPayload.fullBuyPriceDkkPerKwh) ?? planRows[0]?.fullBuyPriceDkkPerKwh ?? fallback.status.fullBuyPriceDkkPerKwh),
      gridPowerKw: roundNumber(inputs.gridPowerKw ?? parseMaybeNumber(statusPayload.gridPowerKw) ?? fallback.status.gridPowerKw),
      mode: normalizeMode(statusPayload.mode, mapBatteryMode(inputs.batteryStatus, settings.autoMode)),
      recommendation: normalizeRecommendation(statusPayload.recommendation, planRows[0]?.action ?? fallback.status.recommendation),
      sellPriceDkkPerKwh: roundNumber(parseMaybeNumber(statusPayload.sellPriceDkkPerKwh) ?? planRows[0]?.sellPriceDkkPerKwh ?? fallback.status.sellPriceDkkPerKwh),
      socPercent: clamp(roundNumber(inputs.batterySocPercent ?? parseMaybeNumber(statusPayload.socPercent) ?? fallback.status.socPercent, 0), 0, 100),
      spotPriceDkkPerKwh: roundNumber(inputs.currentPriceDkkPerKwh ?? parseMaybeNumber(statusPayload.spotPriceDkkPerKwh) ?? fallback.status.spotPriceDkkPerKwh),
      updatedAt,
    },
  }
}

export function slicePlanRows(planRows: BatteryOptimizerPlanRow[], hours: number) {
  return planRows.slice(0, Math.min(hours, planRows.length))
}

function normalizePlanRows(payload: unknown): BatteryOptimizerPlanRow[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).rows)
      ? ((payload as Record<string, unknown>).rows as unknown[])
      : []

  return source
    .map((item) => normalizePlanRow(item))
    .filter((item): item is BatteryOptimizerPlanRow => Boolean(item))
    .sort((left, right) => left.startIso.localeCompare(right.startIso))
}

function normalizePlanRow(payload: unknown): BatteryOptimizerPlanRow | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const row = payload as Record<string, unknown>
  const startIso = normalizeIso(row.startIso ?? row.start ?? row.start_time ?? row.time)
  const endIso = normalizeIso(row.endIso ?? row.end ?? row.end_time)

  if (!startIso || !endIso) {
    return null
  }

  return {
    action: normalizeRecommendation(row.action, 'HOLD'),
    endIso,
    expectedHouseUsageKwh: roundNumber(parseMaybeNumber(row.expectedHouseUsageKwh ?? row.houseUsageKwh ?? row.expected_usage_kwh) ?? 0),
    expectedProfitDkk: roundNumber(parseMaybeNumber(row.expectedProfitDkk ?? row.expected_profit_dkk ?? row.profitDkk) ?? 0),
    expectedSolarSurplusKwh: roundNumber(parseMaybeNumber(row.expectedSolarSurplusKwh ?? row.solarSurplusKwh ?? row.expected_solar_surplus_kwh) ?? 0),
    fullBuyPriceDkkPerKwh: roundNumber(parseMaybeNumber(row.fullBuyPriceDkkPerKwh ?? row.full_buy_price ?? row.buyPriceDkkPerKwh) ?? 0),
    sellPriceDkkPerKwh: roundNumber(parseMaybeNumber(row.sellPriceDkkPerKwh ?? row.sell_price ?? row.exportPriceDkkPerKwh) ?? 0),
    spotPriceDkkPerKwh: roundNumber(parseMaybeNumber(row.spotPriceDkkPerKwh ?? row.spot_price ?? row.price) ?? 0),
    startIso,
    targetSocPercent: clamp(roundNumber(parseMaybeNumber(row.targetSocPercent ?? row.target_soc_percent ?? row.targetSoc) ?? 0, 0), 0, 100),
  }
}

function normalizeDecisionSummary(
  payload: Partial<BatteryOptimizerDecisionSummary> | undefined,
  planRows: BatteryOptimizerPlanRow[],
  fallback: BatteryOptimizerDecisionSummary,
): BatteryOptimizerDecisionSummary {
  const derived = deriveDecisionSummary(planRows)
  return {
    avoidBuyHours: normalizeStringList(payload?.avoidBuyHours) ?? derived.avoidBuyHours,
    bestBuyHours: normalizeStringList(payload?.bestBuyHours) ?? derived.bestBuyHours,
    bestSellHours: normalizeStringList(payload?.bestSellHours) ?? derived.bestSellHours,
    evChargingRecommendation: normalizeString(payload?.evChargingRecommendation) ?? fallback.evChargingRecommendation,
    expectedDailyArbitrageProfitDkk: roundNumber(
      parseMaybeNumber(payload?.expectedDailyArbitrageProfitDkk) ?? derived.expectedDailyArbitrageProfitDkk,
    ),
    reserveForHouseUsage: normalizeString(payload?.reserveForHouseUsage) ?? fallback.reserveForHouseUsage,
  }
}

function normalizeSettings(payload: BatteryOptimizerApiSettingsPayload, fallback: BatteryOptimizerSettings): BatteryOptimizerSettings {
  return {
    allowBatteryExport: normalizeBoolean(payload.allowBatteryExport, fallback.allowBatteryExport),
    allowGridCharging: normalizeBoolean(payload.allowGridCharging, fallback.allowGridCharging),
    autoMode: normalizeBoolean(payload.autoMode, fallback.autoMode),
    dryRun: normalizeBoolean(payload.dryRun, fallback.dryRun),
    maxGridChargeKwh: roundNumber(parseMaybeNumber(payload.maxGridChargeKwh) ?? fallback.maxGridChargeKwh),
    minReservePercent: clamp(roundNumber(parseMaybeNumber(payload.minReservePercent) ?? fallback.minReservePercent, 0), 0, 100),
    pausedUntil: normalizeNullableString(payload.pausedUntil),
  }
}

function normalizeCharts(
  payload: Partial<{
    plannedBatteryPower: unknown
    priceCurve: unknown
    profitByHour: unknown
    socForecast: unknown
  }> | undefined,
  planRows: BatteryOptimizerPlanRow[],
  fallback: BatteryOptimizerCharts,
): BatteryOptimizerCharts {
  const derived = deriveCharts(planRows)
  return {
    plannedBatteryPower: normalizeChartSeries(payload?.plannedBatteryPower) ?? derived.plannedBatteryPower ?? fallback.plannedBatteryPower,
    priceCurve: normalizeChartSeries(payload?.priceCurve) ?? derived.priceCurve ?? fallback.priceCurve,
    profitByHour: normalizeChartSeries(payload?.profitByHour) ?? derived.profitByHour ?? fallback.profitByHour,
    socForecast: normalizeChartSeries(payload?.socForecast) ?? derived.socForecast ?? fallback.socForecast,
  }
}

export function deriveCharts(planRows: BatteryOptimizerPlanRow[]): BatteryOptimizerCharts {
  const labels = planRows.map((row) => formatHourLabel(row.startIso))
  let rollingSoc = planRows[0]?.targetSocPercent ?? 60

  return {
    plannedBatteryPower: {
      labels,
      points: planRows.map((row) => {
        if (row.action === 'BUY' || row.action === 'CHARGE') {
          return 2.8
        }
        if (row.action === 'SELL' || row.action === 'DISCHARGE') {
          return -2.3
        }
        return 0
      }),
    },
    priceCurve: {
      labels,
      points: planRows.map((row) => row.spotPriceDkkPerKwh),
    },
    profitByHour: {
      labels,
      points: planRows.map((row) => row.expectedProfitDkk),
    },
    socForecast: {
      labels,
      points: planRows.map((row) => {
        rollingSoc = clamp(row.targetSocPercent || rollingSoc, 0, 100)
        return rollingSoc
      }),
    },
  }
}

function deriveDecisionSummary(planRows: BatteryOptimizerPlanRow[]): BatteryOptimizerDecisionSummary {
  const bestSellHours = planRows.filter((row) => row.action === 'SELL').slice(0, 4).map((row) => formatHourLabel(row.startIso))
  const bestBuyHours = planRows.filter((row) => row.action === 'BUY' || row.action === 'CHARGE').slice(0, 4).map((row) => formatHourLabel(row.startIso))
  const avoidBuyHours = planRows
    .filter((row) => row.action === 'SELL' || row.spotPriceDkkPerKwh >= percentile(planRows.map((item) => item.spotPriceDkkPerKwh), 0.82))
    .slice(0, 4)
    .map((row) => formatHourLabel(row.startIso))

  return {
    avoidBuyHours,
    bestBuyHours,
    bestSellHours,
    evChargingRecommendation: 'Prefer solar charging, otherwise wait for the next cheap price valley.',
    expectedDailyArbitrageProfitDkk: roundNumber(planRows.slice(0, 24).reduce((sum, row) => sum + row.expectedProfitDkk, 0)),
    reserveForHouseUsage: 'Keep enough reserve for the evening load ramp and the next expensive import window.',
  }
}

function getExpectedProfit({
  action,
  expectedHouseUsageKwh,
  expectedSolarSurplusKwh,
  fullBuyPriceDkkPerKwh,
  sellPriceDkkPerKwh,
  spotPriceDkkPerKwh,
}: {
  action: BatteryOptimizerRecommendation
  expectedHouseUsageKwh: number
  expectedSolarSurplusKwh: number
  fullBuyPriceDkkPerKwh: number
  sellPriceDkkPerKwh: number
  spotPriceDkkPerKwh: number
}) {
  if (action === 'SELL') {
    return roundNumber(Math.max(0.8, expectedSolarSurplusKwh + 0.6) * sellPriceDkkPerKwh)
  }

  if (action === 'DISCHARGE') {
    return roundNumber(Math.max(0.6, expectedHouseUsageKwh) * Math.max(spotPriceDkkPerKwh - 0.34, 0))
  }

  if (action === 'BUY') {
    return roundNumber(-Math.max(0.7, expectedHouseUsageKwh) * fullBuyPriceDkkPerKwh)
  }

  if (action === 'CHARGE') {
    return roundNumber(Math.max(0.2, expectedSolarSurplusKwh) * 0.14)
  }

  return roundNumber(Math.max(0, expectedSolarSurplusKwh - expectedHouseUsageKwh) * 0.05)
}

function decideMockAction({
  allowBatteryExport,
  allowGridCharging,
  cheapThreshold,
  expensiveThreshold,
  expectedSolarSurplusKwh,
  fullBuyPriceDkkPerKwh,
  rollingSoc,
  sellPriceDkkPerKwh,
  spotPriceDkkPerKwh,
}: {
  allowBatteryExport: boolean
  allowGridCharging: boolean
  cheapThreshold: number
  expensiveThreshold: number
  expectedSolarSurplusKwh: number
  fullBuyPriceDkkPerKwh: number
  index: number
  rollingSoc: number
  sellPriceDkkPerKwh: number
  spotPriceDkkPerKwh: number
}): BatteryOptimizerRecommendation {
  if (expectedSolarSurplusKwh >= 1.1 && rollingSoc <= 92) {
    return 'CHARGE'
  }

  if (allowBatteryExport && sellPriceDkkPerKwh >= expensiveThreshold && rollingSoc >= 62) {
    return 'SELL'
  }

  if (spotPriceDkkPerKwh >= expensiveThreshold && rollingSoc >= 34) {
    return 'DISCHARGE'
  }

  if (allowGridCharging && fullBuyPriceDkkPerKwh <= cheapThreshold + 0.34 && rollingSoc <= 78) {
    return 'BUY'
  }

  return 'HOLD'
}

function getUpcomingPeakHours(days: PeakRateDay[], nowMs: number, maxHours: number) {
  return days
    .flatMap((day) => day.prices)
    .filter((price) => Date.parse(price.endIso) > nowMs)
    .sort((left, right) => left.startIso.localeCompare(right.startIso))
    .slice(0, maxHours)
}

function getForecastByHour(windows: SolarForecastWindow[]) {
  return windows.reduce<Map<string, number>>((map, window) => {
    const hourKey = window.time.slice(0, 13)
    map.set(hourKey, roundNumber((map.get(hourKey) ?? 0) + window.kwh))
    return map
  }, new Map())
}

function createSyntheticPriceHours(nowMs: number, hours: number, basePrice: number): PeakRateHour[] {
  const start = new Date(nowMs)
  start.setMinutes(0, 0, 0)
  return Array.from({ length: hours }, (_, index) => {
    const startMs = start.getTime() + index * 60 * 60 * 1000
    const date = new Date(startMs)
    const price = roundNumber(basePrice + Math.sin(index / 3) * 0.38 + (index % 9 === 0 ? 0.22 : 0))
    return {
      date: date.toISOString().slice(0, 10),
      endIso: new Date(startMs + 60 * 60 * 1000).toISOString(),
      hour: date.getHours(),
      label: formatHourLabel(date.toISOString()),
      price,
      startIso: date.toISOString(),
    }
  })
}

function getMockHouseUsage(startIso: string) {
  const hour = new Date(startIso).getHours()
  if (hour >= 6 && hour <= 8) {
    return 1.2
  }
  if (hour >= 17 && hour <= 22) {
    return 1.7
  }
  if (hour >= 0 && hour <= 4) {
    return 0.45
  }
  return 0.85
}

function mapBatteryMode(status: string, autoMode: boolean): BatteryOptimizerMode {
  const normalized = status.toLowerCase()
  if (normalized.includes('charg')) {
    return 'charge'
  }
  if (normalized.includes('discharg')) {
    return 'discharge'
  }
  if (normalized.includes('idle')) {
    return autoMode ? 'auto' : 'idle'
  }
  return autoMode ? 'auto' : 'manual'
}

function normalizeMode(value: unknown, fallback: BatteryOptimizerMode): BatteryOptimizerMode {
  const normalized = normalizeString(value)?.toLowerCase()
  if (
    normalized === 'auto' ||
    normalized === 'manual' ||
    normalized === 'idle' ||
    normalized === 'charge' ||
    normalized === 'discharge' ||
    normalized === 'export'
  ) {
    return normalized
  }

  return fallback
}

function normalizeRecommendation(value: unknown, fallback: BatteryOptimizerRecommendation): BatteryOptimizerRecommendation {
  const normalized = normalizeString(value)?.toUpperCase()
  if (normalized === 'BUY' || normalized === 'CHARGE' || normalized === 'DISCHARGE' || normalized === 'HOLD' || normalized === 'SELL') {
    return normalized
  }

  return fallback
}

function normalizeChartSeries(payload: unknown): BatteryOptimizerChartSeries | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  if (!Array.isArray(record.labels) || !Array.isArray(record.points)) {
    return null
  }

  return {
    labels: record.labels.map((item) => String(item)),
    points: record.points.map((item) => roundNumber(parseMaybeNumber(item) ?? 0)),
  }
}

function normalizeIso(value: unknown) {
  const normalized = normalizeString(value)
  if (!normalized) {
    return null
  }

  const parsedMs = Date.parse(normalized)
  return Number.isFinite(parsedMs) ? new Date(parsedMs).toISOString() : null
}

function normalizeNullableString(value: unknown) {
  const normalized = normalizeString(value)
  return normalized || null
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : null
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseMaybeNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function roundNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function percentile(values: number[], ratio: number) {
  if (!values.length) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))
  return sorted[index]
}

function formatHourLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

function getEnvValue(key: string) {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key]
}
