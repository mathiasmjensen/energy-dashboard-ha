import { readFile, writeFile } from 'node:fs/promises'

const DEFAULT_SETTINGS = {
  allowBatteryExport: true,
  allowGridCharging: true,
  autoMode: true,
  dryRun: true,
  maxGridChargeKwh: 8,
  minReservePercent: 20,
  pausedUntil: null,
}

export function createDefaultServerState() {
  return {
    appliedPlan: null,
    cachedSnapshot: null,
    settings: { ...DEFAULT_SETTINGS },
  }
}

export async function loadJsonFile(filePath, fallbackValue) {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallbackValue
  }
}

export async function saveJsonFile(filePath, value) {
  await writeFile(filePath, JSON.stringify(value, null, 2))
}

export function mergeSettings(current, next) {
  return {
    ...DEFAULT_SETTINGS,
    ...current,
    ...pickDefined(next),
  }
}

export function normalizeLiveStatus({
  batteryPowerKw,
  batterySocPercent,
  gridPowerKw,
  homePowerKw,
  solarPowerKw,
}) {
  return {
    batteryPowerKw: asNumber(batteryPowerKw, 0),
    batterySocPercent: clamp(asNumber(batterySocPercent, 50), 0, 100),
    gridPowerKw: asNumber(gridPowerKw, 0),
    homePowerKw: Math.max(0, asNumber(homePowerKw, 0.8)),
    solarPowerKw: Math.max(0, asNumber(solarPowerKw, 0)),
  }
}

export function normalizePriceWindows(payload) {
  const source = unwrapCollectionPayload(payload)
  if (!Array.isArray(source)) {
    return []
  }

  return source
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const row = item
      const startIso = String(row.start ?? row.startIso ?? '')
      const endIso = String(row.end ?? row.endIso ?? '')
      const startMs = Date.parse(startIso)
      const endMs = Date.parse(endIso)
      const rawPrice = asNumber(row.price, null)

      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs || rawPrice === null) {
        return null
      }

      const price = Math.abs(rawPrice) >= 20 ? rawPrice / 100 : rawPrice
      return {
        endIso: new Date(endMs).toISOString(),
        endMs,
        price: round(price, 4),
        startIso: new Date(startMs).toISOString(),
        startMs,
      }
    })
    .filter(Boolean)
    .sort((left, right) => left.startMs - right.startMs)
}

export function normalizeSolarForecast(payload) {
  const parsed = typeof payload === 'string' ? safeParseJson(payload) : payload
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.rates)) {
    return parsed.rates
      .map((rate) => {
        const startIso = String(rate.start ?? '')
        const endIso = String(rate.end ?? '')
        const startMs = Date.parse(startIso)
        const endMs = Date.parse(endIso)
        const valueW = asNumber(rate.value, null)
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs || valueW === null) {
          return null
        }

        const powerKw = Math.max(0, valueW / 1000)
        const hours = (endMs - startMs) / 3_600_000
        return {
          endTime: new Date(endMs).toISOString(),
          kwh: round(powerKw * hours, 4),
          powerKw: round(powerKw, 4),
          time: new Date(startMs).toISOString(),
        }
      })
      .filter(Boolean)
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((window) => {
        const startIso = String(window.time ?? window.start ?? '')
        const endIso = String(window.endTime ?? window.end ?? '')
        const startMs = Date.parse(startIso)
        const endMs = Date.parse(endIso)
        const kwh = asNumber(window.kwh, null)
        const powerKw = asNumber(window.powerKw ?? window.value, null)
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
          return null
        }

        const durationHours = (endMs - startMs) / 3_600_000
        const resolvedPowerKw = powerKw ?? (kwh === null ? 0 : kwh / durationHours)
        const resolvedKwh = kwh ?? resolvedPowerKw * durationHours
        return {
          endTime: new Date(endMs).toISOString(),
          kwh: round(Math.max(0, resolvedKwh), 4),
          powerKw: round(Math.max(0, resolvedPowerKw), 4),
          time: new Date(startMs).toISOString(),
        }
      })
      .filter(Boolean)
  }

  return []
}

export function createSyntheticPriceWindows(nowMs, hours = 48, basePrice = 1.6) {
  const start = alignToHour(nowMs)
  return Array.from({ length: hours }, (_, index) => {
    const startMs = start + index * 3_600_000
    const endMs = startMs + 3_600_000
    const hour = new Date(startMs).getHours()
    const dayWave = Math.sin((index / 24) * Math.PI * 2) * 0.18
    const hourWave = Math.cos(((hour - 18) / 24) * Math.PI * 2) * 0.32
    const eveningPeak = hour >= 17 && hour <= 21 ? 0.42 : 0
    const nightDip = hour >= 1 && hour <= 5 ? -0.28 : 0
    const price = Math.max(0.08, basePrice + dayWave + hourWave + eveningPeak + nightDip)
    return {
      endIso: new Date(endMs).toISOString(),
      endMs,
      price: round(price, 4),
      startIso: new Date(startMs).toISOString(),
      startMs,
    }
  })
}

export function createSyntheticSolarForecast(nowMs, hours = 48, peakKw = 6.5) {
  const start = alignToHour(nowMs)
  return Array.from({ length: hours }, (_, index) => {
    const startMs = start + index * 3_600_000
    const endMs = startMs + 3_600_000
    const hour = new Date(startMs).getHours()
    const daylight = hour >= 4 && hour <= 21
    const curvePosition = daylight ? (hour - 4) / 17 : 0
    const powerKw = daylight ? Math.max(0, Math.sin(curvePosition * Math.PI) * peakKw) : 0
    return {
      endTime: new Date(endMs).toISOString(),
      kwh: round(powerKw, 4),
      powerKw: round(powerKw, 4),
      time: new Date(startMs).toISOString(),
    }
  })
}

export function buildOptimizerSnapshot({
  nowMs,
  priceWindows,
  serverState,
  solarForecastWindows,
  liveStatus,
  priceAdjustmentDkk,
  sellAdjustmentDkk,
}) {
  const effectiveSettings = mergeSettings(DEFAULT_SETTINGS, serverState.settings)
  const windows = priceWindows.length ? priceWindows : createSyntheticPriceWindows(nowMs)
  const forecast = solarForecastWindows.length ? solarForecastWindows : createSyntheticSolarForecast(nowMs)
  const planRows = derivePlanRows({
    nowMs,
    priceAdjustmentDkk,
    priceWindows: windows,
    sellAdjustmentDkk,
    settings: effectiveSettings,
    solarForecastWindows: forecast,
    status: liveStatus,
  })
  const summary = deriveDecisionSummary(planRows, effectiveSettings)
  const charts = deriveCharts(planRows)
  const currentRow =
    planRows.find((row) => {
      const startMs = Date.parse(row.startIso)
      const endMs = Date.parse(row.endIso)
      return startMs <= nowMs && nowMs < endMs
    }) ?? planRows[0]
  const status = {
    batteryPowerKw: round(liveStatus.batteryPowerKw, 4),
    estimatedProfitTodayDkk: round(summary.expectedDailyArbitrageProfitDkk, 2),
    fullBuyPriceDkkPerKwh: currentRow ? currentRow.fullBuyPriceDkkPerKwh : 0,
    gridPowerKw: round(liveStatus.gridPowerKw, 4),
    mode: deriveCurrentMode({
      autoMode: effectiveSettings.autoMode,
      batteryPowerKw: liveStatus.batteryPowerKw,
      currentAction: currentRow?.action ?? 'HOLD',
      pausedUntil: effectiveSettings.pausedUntil,
    }),
    recommendation: currentRow?.action ?? 'HOLD',
    sellPriceDkkPerKwh: currentRow ? currentRow.sellPriceDkkPerKwh : 0,
    socPercent: round(liveStatus.batterySocPercent, 0),
    spotPriceDkkPerKwh: currentRow ? currentRow.spotPriceDkkPerKwh : 0,
    updatedAt: new Date(nowMs).toISOString(),
  }

  return {
    charts,
    decisionSummary: summary,
    planRows,
    settings: effectiveSettings,
    status,
  }
}

function derivePlanRows({
  nowMs,
  priceAdjustmentDkk,
  priceWindows,
  sellAdjustmentDkk,
  settings,
  solarForecastWindows,
  status,
}) {
  const futureWindows = priceWindows.filter((window) => window.endMs > nowMs).slice(0, 48)
  const percentilePrices = futureWindows.map((window) => window.price)
  const cheapThreshold = percentile(percentilePrices, 0.28)
  const expensiveThreshold = percentile(percentilePrices, 0.78)
  const forecastMap = new Map(
    solarForecastWindows.map((window) => [new Date(window.time).toISOString().slice(0, 13), window]),
  )
  let rollingSoc = clamp(status.batterySocPercent, 0, 100)

  return futureWindows.map((window, index) => {
    const hourKey = window.startIso.slice(0, 13)
    const forecastWindow = forecastMap.get(hourKey)
    const expectedSolarSurplusKwh = round(
      Math.max(0, (forecastWindow?.kwh ?? forecastWindow?.powerKw ?? 0) - getExpectedHouseUsage(window.startMs, status.homePowerKw)),
      4,
    )
    const expectedHouseUsageKwh = round(getExpectedHouseUsage(window.startMs, status.homePowerKw), 4)
    const fullBuyPriceDkkPerKwh = round(window.price + priceAdjustmentDkk, 4)
    const sellPriceDkkPerKwh = round(Math.max(0.02, window.price - sellAdjustmentDkk), 4)
    const action = chooseAction({
      allowBatteryExport: settings.allowBatteryExport,
      allowGridCharging: settings.allowGridCharging,
      cheapThreshold,
      currentTimeMs: window.startMs,
      expensiveThreshold,
      expectedHouseUsageKwh,
      expectedSolarSurplusKwh,
      fullBuyPriceDkkPerKwh,
      index,
      minReservePercent: settings.minReservePercent,
      pausedUntil: settings.pausedUntil,
      rollingSoc,
      sellPriceDkkPerKwh,
      spotPriceDkkPerKwh: window.price,
    })
    const expectedProfitDkk = estimateProfit({
      action,
      expectedHouseUsageKwh,
      expectedSolarSurplusKwh,
      fullBuyPriceDkkPerKwh,
      sellPriceDkkPerKwh,
      spotPriceDkkPerKwh: window.price,
    })

    rollingSoc = nextSoc(rollingSoc, action, expectedSolarSurplusKwh)

    return {
      action,
      endIso: window.endIso,
      expectedHouseUsageKwh,
      expectedProfitDkk,
      expectedSolarSurplusKwh,
      fullBuyPriceDkkPerKwh,
      sellPriceDkkPerKwh,
      spotPriceDkkPerKwh: round(window.price, 4),
      startIso: window.startIso,
      targetSocPercent: round(rollingSoc, 0),
    }
  })
}

function chooseAction({
  allowBatteryExport,
  allowGridCharging,
  cheapThreshold,
  currentTimeMs,
  expensiveThreshold,
  expectedHouseUsageKwh,
  expectedSolarSurplusKwh,
  fullBuyPriceDkkPerKwh,
  index,
  minReservePercent,
  pausedUntil,
  rollingSoc,
  sellPriceDkkPerKwh,
  spotPriceDkkPerKwh,
}) {
  if (pausedUntil && Date.parse(pausedUntil) > currentTimeMs) {
    return 'HOLD'
  }

  if (expectedSolarSurplusKwh > Math.max(0.3, expectedHouseUsageKwh * 0.35)) {
    if (rollingSoc < 96) {
      return 'CHARGE'
    }
    if (allowBatteryExport && sellPriceDkkPerKwh >= expensiveThreshold - 0.12) {
      return 'SELL'
    }
    return 'HOLD'
  }

  if (allowGridCharging && fullBuyPriceDkkPerKwh <= cheapThreshold + 0.35 && rollingSoc < 84 && index < 18) {
    return 'BUY'
  }

  if (allowBatteryExport && sellPriceDkkPerKwh >= expensiveThreshold - 0.08 && rollingSoc > minReservePercent + 14) {
    return 'SELL'
  }

  if (spotPriceDkkPerKwh >= expensiveThreshold && rollingSoc > minReservePercent + 8) {
    return 'DISCHARGE'
  }

  return 'HOLD'
}

function nextSoc(currentSoc, action, expectedSolarSurplusKwh) {
  const solarBonus = expectedSolarSurplusKwh > 0 ? Math.min(8, expectedSolarSurplusKwh * 2.4) : 0
  const delta =
    action === 'BUY'
      ? 9
      : action === 'CHARGE'
        ? 5 + solarBonus
        : action === 'DISCHARGE'
          ? -6
          : action === 'SELL'
            ? -10
            : 0

  return clamp(currentSoc + delta, 8, 100)
}

function estimateProfit({
  action,
  expectedHouseUsageKwh,
  expectedSolarSurplusKwh,
  fullBuyPriceDkkPerKwh,
  sellPriceDkkPerKwh,
  spotPriceDkkPerKwh,
}) {
  if (action === 'BUY') {
    return round(-Math.min(3, 1 + expectedHouseUsageKwh * 0.25) * fullBuyPriceDkkPerKwh, 2)
  }
  if (action === 'SELL') {
    return round(Math.max(1, expectedSolarSurplusKwh + 0.8) * sellPriceDkkPerKwh, 2)
  }
  if (action === 'DISCHARGE') {
    return round(Math.max(0.2, expectedHouseUsageKwh) * spotPriceDkkPerKwh * 0.35, 2)
  }
  if (action === 'CHARGE') {
    return round(expectedSolarSurplusKwh * 0.18, 2)
  }
  return round(expectedSolarSurplusKwh * 0.02, 2)
}

function deriveDecisionSummary(planRows, settings) {
  const bestSellHours = planRows.filter((row) => row.action === 'SELL').slice(0, 4).map(formatHourLabel)
  const bestBuyHours = planRows.filter((row) => row.action === 'BUY' || row.action === 'CHARGE').slice(0, 4).map(formatHourLabel)
  const avoidBuyHours = planRows
    .filter((row) => row.fullBuyPriceDkkPerKwh > row.spotPriceDkkPerKwh + 0.7)
    .slice(0, 4)
    .map(formatHourLabel)

  return {
    avoidBuyHours,
    bestBuyHours,
    bestSellHours,
    evChargingRecommendation: bestBuyHours.length
      ? `Wait for ${bestBuyHours[0]} or use solar surplus first.`
      : 'Prefer solar charging while the optimizer holds battery reserve.',
    expectedDailyArbitrageProfitDkk: round(
      planRows
        .slice(0, 24)
        .reduce((sum, row) => sum + row.expectedProfitDkk, 0),
      2,
    ),
    reserveForHouseUsage:
      settings.minReservePercent >= 25
        ? 'Battery reserve is biased toward home usage before export.'
        : 'Battery may trade more aggressively before the next peak window.',
  }
}

function deriveCharts(planRows) {
  const labels = planRows.map((row) => formatShortHour(row.startIso))
  return {
    plannedBatteryPower: {
      labels,
      points: planRows.map((row) => round(plannedPowerForAction(row.action), 2)),
    },
    priceCurve: {
      labels,
      points: planRows.map((row) => row.fullBuyPriceDkkPerKwh),
    },
    profitByHour: {
      labels,
      points: planRows.map((row) => row.expectedProfitDkk),
    },
    socForecast: {
      labels,
      points: planRows.map((row) => row.targetSocPercent),
    },
  }
}

function deriveCurrentMode({ autoMode, batteryPowerKw, currentAction, pausedUntil }) {
  if (pausedUntil && Date.parse(pausedUntil) > Date.now()) {
    return 'idle'
  }
  if (!autoMode) {
    return 'manual'
  }
  if (currentAction === 'SELL') {
    return 'export'
  }
  if (currentAction === 'BUY' || currentAction === 'CHARGE') {
    return 'charge'
  }
  if (currentAction === 'DISCHARGE') {
    return 'discharge'
  }
  if (Math.abs(batteryPowerKw) < 0.05) {
    return 'idle'
  }
  return batteryPowerKw > 0 ? 'discharge' : 'charge'
}

function getExpectedHouseUsage(startMs, baseHomePowerKw) {
  const hour = new Date(startMs).getHours()
  const evening = hour >= 17 && hour <= 22 ? 0.6 : 0
  const overnight = hour >= 0 && hour <= 5 ? -0.15 : 0
  const workdayDip = hour >= 10 && hour <= 15 ? -0.1 : 0
  return Math.max(0.25, baseHomePowerKw + evening + overnight + workdayDip)
}

function plannedPowerForAction(action) {
  if (action === 'BUY') {
    return 3.2
  }
  if (action === 'CHARGE') {
    return 2.1
  }
  if (action === 'DISCHARGE') {
    return -2.4
  }
  if (action === 'SELL') {
    return -3.1
  }
  return 0
}

function formatHourLabel(row) {
  return `${formatShortHour(row.startIso)} - ${formatShortHour(row.endIso)}`
}

function formatShortHour(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

function percentile(values, fraction) {
  if (!values.length) {
    return 0
  }
  const sorted = [...values].sort((left, right) => left - right)
  const index = clamp(Math.floor((sorted.length - 1) * fraction), 0, sorted.length - 1)
  return sorted[index]
}

function unwrapCollectionPayload(payload) {
  const parsed = typeof payload === 'string' ? safeParseJson(payload) : payload
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (parsed && typeof parsed === 'object') {
    for (const key of ['prices', 'windows', 'rates', 'data', 'items']) {
      if (Array.isArray(parsed[key])) {
        return parsed[key]
      }
    }
  }
  return parsed
}

function pickDefined(object) {
  return Object.fromEntries(Object.entries(object ?? {}).filter(([, value]) => value !== undefined))
}

function safeParseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function alignToHour(timestampMs) {
  const date = new Date(timestampMs)
  date.setMinutes(0, 0, 0)
  return date.getTime()
}

function asNumber(value, fallbackValue) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallbackValue
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
