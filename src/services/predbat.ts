import type {
  BatteryOptimizerApiPlanPayload,
  BatteryOptimizerApiSettingsPayload,
  BatteryOptimizerApiStatusPayload,
  BatteryOptimizerLiveInputs,
  BatteryOptimizerRecommendation,
} from '../models/batteryOptimizer'
import type { HassEntityMap, PredbatResolvedEntities } from '../models/predbat'
import { getConfiguredPredbatEntityIds, type PredbatEntityKey, PREDBAT_ENTITY_DEFAULTS } from '../data/predbatEntities'

export type BatteryOptimizerRuntimeMode = 'legacy-api' | 'mock' | 'predbat'

export function getBatteryOptimizerMode(): BatteryOptimizerRuntimeMode {
  const configured = String(import.meta.env.VITE_BATTERY_OPTIMIZER_MODE ?? '')
    .trim()
    .toLowerCase()

  if (configured === 'predbat' || configured === 'mock' || configured === 'legacy-api') {
    return configured
  }

  if (configured === 'ha-proxy' || configured === 'direct-api') {
    return 'legacy-api'
  }

  return 'predbat'
}

export function resolvePredbatEntities(entities: HassEntityMap): PredbatResolvedEntities {
  const resolved: PredbatResolvedEntities = {}

  for (const key of Object.keys(PREDBAT_ENTITY_DEFAULTS) as PredbatEntityKey[]) {
    const entityId = getConfiguredPredbatEntityIds(key).find((candidate) => Boolean(entities[candidate]))
    if (!entityId) {
      continue
    }

    resolved[key] = {
      entity: entities[entityId],
      entityId,
    }
  }

  return resolved
}

export function hasPredbatData(resolved: PredbatResolvedEntities) {
  return Boolean(
    resolved.planSensor ||
      resolved.modeSelect ||
      resolved.statusSensor ||
      resolved.recommendationSensor ||
      resolved.spotPriceSensor,
  )
}

export function buildPredbatSnapshotPayloads(
  resolved: PredbatResolvedEntities,
  inputs: BatteryOptimizerLiveInputs,
): {
  planPayload: BatteryOptimizerApiPlanPayload
  settingsPayload: BatteryOptimizerApiSettingsPayload
  statusPayload: BatteryOptimizerApiStatusPayload
} {
  const rows = normalizePredbatPlanRows(resolved)
  const recommendation = normalizeRecommendation(
    getEntityState(resolved.recommendationSensor?.entity) ??
      getEntityAttributeString(resolved.statusSensor?.entity, 'recommendation') ??
      rows[0]?.action,
    rows[0]?.action ?? 'HOLD',
  )
  const decisionSummary = deriveDecisionSummaryFromRows(rows, recommendation)
  const statusPayload: BatteryOptimizerApiStatusPayload = {
    batteryPowerKw: inputs.batteryPowerKw ?? undefined,
    estimatedProfitTodayDkk:
      getEntityNumber(resolved.profitTodaySensor?.entity) ??
      getEntityAttributeNumber(resolved.statusSensor?.entity, 'estimatedProfitTodayDkk') ??
      decisionSummary.expectedDailyArbitrageProfitDkk,
    fullBuyPriceDkkPerKwh:
      getEntityNumber(resolved.fullBuyPriceSensor?.entity) ??
      getEntityAttributeNumber(resolved.statusSensor?.entity, 'fullBuyPriceDkkPerKwh') ??
      rows[0]?.fullBuyPriceDkkPerKwh,
    gridPowerKw: inputs.gridPowerKw ?? undefined,
    mode: normalizePredbatMode(
      getEntityState(resolved.modeSelect?.entity) ?? getEntityAttributeString(resolved.statusSensor?.entity, 'mode'),
      isEntityOn(resolved.readOnlySwitch?.entity),
    ),
    recommendation,
    sellPriceDkkPerKwh:
      getEntityNumber(resolved.sellPriceSensor?.entity) ??
      getEntityAttributeNumber(resolved.statusSensor?.entity, 'sellPriceDkkPerKwh') ??
      rows[0]?.sellPriceDkkPerKwh,
    socPercent: inputs.batterySocPercent ?? undefined,
    spotPriceDkkPerKwh:
      getEntityNumber(resolved.spotPriceSensor?.entity) ??
      getEntityAttributeNumber(resolved.statusSensor?.entity, 'spotPriceDkkPerKwh') ??
      rows[0]?.spotPriceDkkPerKwh,
    updatedAt:
      getEntityState(resolved.updatedAtSensor?.entity) ??
      getEntityAttributeString(resolved.planSensor?.entity, 'updatedAt') ??
      resolved.planSensor?.entity.last_updated ??
      resolved.statusSensor?.entity.last_updated ??
      new Date().toISOString(),
  }

  const settingsPayload: BatteryOptimizerApiSettingsPayload = {
    allowBatteryExport:
      getEntityBoolean(resolved.allowBatteryExportSwitch?.entity) ??
      getEntityAttributeBoolean(resolved.statusSensor?.entity, 'allowBatteryExport') ??
      false,
    allowGridCharging:
      getEntityBoolean(resolved.allowGridChargingSwitch?.entity) ??
      getEntityAttributeBoolean(resolved.statusSensor?.entity, 'allowGridCharging') ??
      false,
    autoMode:
      normalizePredbatMode(getEntityState(resolved.modeSelect?.entity), isEntityOn(resolved.readOnlySwitch?.entity)) !== 'manual',
    dryRun: isEntityOn(resolved.readOnlySwitch?.entity) ?? false,
    maxGridChargeKwh:
      getEntityNumber(resolved.maxGridChargeInput?.entity) ??
      getEntityAttributeNumber(resolved.statusSensor?.entity, 'maxGridChargeKwh') ??
      0,
    minReservePercent:
      getEntityNumber(resolved.reserveInput?.entity) ??
      getEntityAttributeNumber(resolved.statusSensor?.entity, 'minReservePercent') ??
      0,
    pausedUntil:
      getNormalizedDateTimeState(resolved.pausedUntilHelper?.entity) ??
      getEntityAttributeString(resolved.statusSensor?.entity, 'pausedUntil') ??
      null,
  }

  const planPayload: BatteryOptimizerApiPlanPayload = {
    charts: buildPredbatChartPayload(rows),
    decisionSummary,
    rows,
    updatedAt: statusPayload.updatedAt,
  }

  return {
    planPayload,
    settingsPayload,
    statusPayload,
  }
}

export function getPredbatControlModeOption() {
  return String(import.meta.env.VITE_PREDBAT_CONTROL_MODE_OPTION ?? 'Control charge & discharge').trim() || 'Control charge & discharge'
}

export function getPredbatMonitorModeOption() {
  return String(import.meta.env.VITE_PREDBAT_MONITOR_MODE_OPTION ?? 'Monitor').trim() || 'Monitor'
}

function normalizePredbatPlanRows(resolved: PredbatResolvedEntities) {
  const source =
    getEntityAttributeUnknown(resolved.planSensor?.entity, 'raw') ??
    getEntityAttributeUnknown(resolved.planSensor?.entity, 'rows') ??
    getEntityAttributeUnknown(resolved.planSensor?.entity, 'plan') ??
    getEntityAttributeUnknown(resolved.planSensor?.entity, 'results') ??
    parseMaybeJson(getEntityState(resolved.planSensor?.entity))

  const rows = findArrayPayload(source)

  return rows
    .map((row, index) => normalizePredbatPlanRow(row, index))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
}

function normalizePredbatPlanRow(payload: unknown, index: number) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const row = payload as Record<string, unknown>
  const startIso = normalizeSlotIso(
    row.startIso ?? row.start ?? row.start_time ?? row.time ?? row.from ?? row.datetime,
    index,
  )
  const endIso = normalizeSlotIso(
    row.endIso ?? row.end ?? row.end_time ?? row.to,
    index,
    startIso ? new Date(Date.parse(startIso) + 60 * 60 * 1000).toISOString() : null,
  )

  if (!startIso || !endIso) {
    return null
  }

  const spotPrice =
    parseNumber(row.spotPriceDkkPerKwh ?? row.spot_price ?? row.import_rate ?? row.import ?? row.rate ?? row.price) ?? 0
  const fullBuyPrice =
    parseNumber(row.fullBuyPriceDkkPerKwh ?? row.full_buy_price ?? row.buy_price ?? row.import_rate ?? row.import ?? row.price) ?? spotPrice
  const sellPrice =
    parseNumber(row.sellPriceDkkPerKwh ?? row.sell_price ?? row.export_rate ?? row.export ?? row.feed_in_rate) ?? Math.max(spotPrice - 0.1, 0)
  const targetSoc =
    parseNumber(row.targetSocPercent ?? row.target_soc_percent ?? row.soc_target ?? row.soc ?? row.targetSoc) ?? 0
  const expectedSolarSurplus =
    parseNumber(row.expectedSolarSurplusKwh ?? row.expected_solar_surplus_kwh ?? row.solar_surplus ?? row.pv_estimate ?? row.pv) ?? 0
  const expectedHouseUsage =
    parseNumber(row.expectedHouseUsageKwh ?? row.expected_house_usage_kwh ?? row.house_usage ?? row.load ?? row.usage) ?? 0
  const expectedProfit =
    parseNumber(row.expectedProfitDkk ?? row.expected_profit_dkk ?? row.profit ?? row.delta_profit) ?? 0

  return {
    action: normalizeRecommendation(
      row.action ??
        deriveActionFromPredbatRow(row, {
          expectedSolarSurplusKwh: expectedSolarSurplus,
          sellPriceDkkPerKwh: sellPrice,
          spotPriceDkkPerKwh: spotPrice,
          targetSocPercent: targetSoc,
        }),
      'HOLD',
    ),
    endIso,
    expectedHouseUsageKwh: roundNumber(expectedHouseUsage),
    expectedProfitDkk: roundNumber(expectedProfit),
    expectedSolarSurplusKwh: roundNumber(expectedSolarSurplus),
    fullBuyPriceDkkPerKwh: roundNumber(fullBuyPrice),
    sellPriceDkkPerKwh: roundNumber(sellPrice),
    spotPriceDkkPerKwh: roundNumber(spotPrice),
    startIso,
    targetSocPercent: clamp(roundNumber(targetSoc, 0), 0, 100),
  }
}

function deriveActionFromPredbatRow(
  row: Record<string, unknown>,
  fallback: {
    expectedSolarSurplusKwh: number
    sellPriceDkkPerKwh: number
    spotPriceDkkPerKwh: number
    targetSocPercent: number
  },
): BatteryOptimizerRecommendation {
  const charge = parseNumber(row.charge ?? row.charge_kw ?? row.battery_charge_kw)
  const discharge = parseNumber(row.discharge ?? row.discharge_kw ?? row.battery_discharge_kw)
  const exportPower = parseNumber(row.export ?? row.export_kw)
  const importPower = parseNumber(row.import ?? row.import_kw ?? row.grid_charge_kw)

  if ((charge ?? 0) > 0.1 || (importPower ?? 0) > 0.1) {
    return 'CHARGE'
  }

  if ((exportPower ?? 0) > 0.1 && fallback.sellPriceDkkPerKwh >= fallback.spotPriceDkkPerKwh) {
    return 'SELL'
  }

  if ((discharge ?? 0) > 0.1) {
    return 'DISCHARGE'
  }

  if (fallback.expectedSolarSurplusKwh > 0.3 && fallback.targetSocPercent < 90) {
    return 'CHARGE'
  }

  return 'HOLD'
}

function deriveDecisionSummaryFromRows(rows: ReturnType<typeof normalizePredbatPlanRows>, recommendation: BatteryOptimizerRecommendation) {
  return {
    avoidBuyHours: rows.filter((row) => row.spotPriceDkkPerKwh >= percentile(rows.map((item) => item.spotPriceDkkPerKwh), 0.72)).slice(0, 6).map((row) => formatHourLabel(row.startIso)),
    bestBuyHours: rows.filter((row) => row.action === 'BUY' || row.action === 'CHARGE').slice(0, 6).map((row) => formatHourLabel(row.startIso)),
    bestSellHours: rows.filter((row) => row.action === 'SELL' || row.action === 'DISCHARGE').slice(0, 6).map((row) => formatHourLabel(row.startIso)),
    evChargingRecommendation:
      recommendation === 'BUY' || recommendation === 'CHARGE'
        ? 'Charge during the lower-price windows Predbat selected.'
        : 'Wait for a cheaper or more solar-heavy window before EV charging.',
    expectedDailyArbitrageProfitDkk: roundNumber(rows.reduce((sum, row) => sum + row.expectedProfitDkk, 0)),
    reserveForHouseUsage:
      rows.some((row) => row.targetSocPercent >= 45)
        ? 'Predbat is reserving battery energy for later house demand.'
        : 'Predbat is not holding a large reserve in the current plan.',
  }
}

function buildPredbatChartPayload(rows: ReturnType<typeof normalizePredbatPlanRows>) {
  const labels = rows.map((row) => formatHourLabel(row.startIso))
  return {
    plannedBatteryPower: {
      labels,
      points: rows.map((row) => {
        if (row.action === 'BUY' || row.action === 'CHARGE') {
          return 2.4
        }
        if (row.action === 'DISCHARGE' || row.action === 'SELL') {
          return -2.1
        }
        return 0
      }),
    },
    priceCurve: {
      labels,
      points: rows.map((row) => row.spotPriceDkkPerKwh),
    },
    profitByHour: {
      labels,
      points: rows.map((row) => row.expectedProfitDkk),
    },
    socForecast: {
      labels,
      points: rows.map((row) => row.targetSocPercent),
    },
  }
}

function normalizePredbatMode(mode: string | null | undefined, readOnly: boolean | null | undefined) {
  if (readOnly) {
    return 'manual' as const
  }

  const normalized = String(mode ?? '').trim().toLowerCase()

  if (!normalized) {
    return 'idle' as const
  }

  if (normalized.includes('monitor')) {
    return 'idle' as const
  }

  if (normalized.includes('discharge') || normalized.includes('export')) {
    return normalized.includes('charge') ? ('auto' as const) : ('discharge' as const)
  }

  if (normalized.includes('charge')) {
    return 'charge' as const
  }

  if (normalized.includes('manual')) {
    return 'manual' as const
  }

  if (normalized.includes('auto')) {
    return 'auto' as const
  }

  return 'idle' as const
}

function normalizeRecommendation(value: unknown, fallback: BatteryOptimizerRecommendation): BatteryOptimizerRecommendation {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (normalized === 'BUY' || normalized === 'CHARGE' || normalized === 'DISCHARGE' || normalized === 'HOLD' || normalized === 'SELL') {
    return normalized
  }
  return fallback
}

function findArrayPayload(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === 'object') {
    for (const key of ['rows', 'plan', 'raw', 'data', 'results', 'slots']) {
      const nested = (value as Record<string, unknown>)[key]
      if (Array.isArray(nested)) {
        return nested
      }
    }

    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (Array.isArray(nested)) {
        return nested
      }
    }
  }

  return []
}

function normalizeSlotIso(value: unknown, index: number, fallback: string | null = null) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    const parsed = Date.parse(trimmed)
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString()
    }

    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [hours, minutes] = trimmed.split(':').map((part) => Number.parseInt(part, 10))
      const date = new Date()
      date.setMinutes(minutes, 0, 0)
      date.setHours(hours, 0, 0, 0)
      date.setHours(hours, minutes, 0, 0)
      date.setTime(date.getTime() + index * 60 * 60 * 1000)
      return date.toISOString()
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = value > 10_000_000_000 ? value : value * 1000
    return new Date(parsed).toISOString()
  }

  return fallback
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function getEntityState(entity: HassEntityMap[string] | undefined) {
  const value = entity?.state?.trim()
  if (!value) {
    return null
  }
  if (['unknown', 'unavailable', 'none', 'null'].includes(value.toLowerCase())) {
    return null
  }
  return value
}

function getEntityNumber(entity: HassEntityMap[string] | undefined) {
  const value = getEntityState(entity)
  return parseNumber(value)
}

function getEntityBoolean(entity: HassEntityMap[string] | undefined) {
  const value = getEntityState(entity)
  if (!value) {
    return null
  }
  if (value.toLowerCase() === 'on') {
    return true
  }
  if (value.toLowerCase() === 'off') {
    return false
  }
  return null
}

function isEntityOn(entity: HassEntityMap[string] | undefined) {
  const value = getEntityBoolean(entity)
  return value === null ? null : value
}

function getEntityAttributeUnknown(entity: HassEntityMap[string] | undefined, key: string) {
  return entity?.attributes?.[key]
}

function getEntityAttributeString(entity: HassEntityMap[string] | undefined, key: string) {
  const value = entity?.attributes?.[key]
  if (value === null || value === undefined) {
    return null
  }
  const stringValue = String(value).trim()
  return stringValue ? stringValue : null
}

function getEntityAttributeNumber(entity: HassEntityMap[string] | undefined, key: string) {
  return parseNumber(entity?.attributes?.[key])
}

function getEntityAttributeBoolean(entity: HassEntityMap[string] | undefined, key: string) {
  const value = entity?.attributes?.[key]
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'on' || value.toLowerCase() === 'true') {
      return true
    }
    if (value.toLowerCase() === 'off' || value.toLowerCase() === 'false') {
      return false
    }
  }
  return null
}

function getNormalizedDateTimeState(entity: HassEntityMap[string] | undefined) {
  const value = getEntityState(entity)
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString()
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(value.replace(' ', 'T')).toISOString()
  }

  return null
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function roundNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatHourLabel(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function percentile(values: number[], ratio: number) {
  const finite = values.filter(Number.isFinite).sort((left, right) => left - right)
  if (!finite.length) {
    return 0
  }
  const index = Math.min(finite.length - 1, Math.max(0, Math.floor(finite.length * ratio)))
  return finite[index]
}
