import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { getConnectionAccessToken, resolveHaApiBase } from '../services/haApi'
import { ENERGY_ENTITY_NUMERIC_SCALE } from '../data/energyEntities'

const MAX_DAY_OFFSET = 30
const HOUR_MS = 60 * 60 * 1000

type PowerHistoryKey = 'batteryPower' | 'evChargePower' | 'gridPower' | 'homePower' | 'solarPower'
type TotalHistoryKey =
  | 'batteryChargeToday'
  | 'batteryDischargeToday'
  | 'gridExportedToday'
  | 'gridImportToday'
  | 'homeEnergyToday'
  | 'solarProductionToday'
type HistoryKey = PowerHistoryKey | TotalHistoryKey

type NormalizedHistoryRow = {
  changedMs: number
  value: number
}

type HistoricalEnergyDayResult = {
  controls: {
    canGoNext: boolean
    canGoPrevious: boolean
    label: string
    onNext: () => void
    onPrevious: () => void
  }
  distribution: {
    battery: string
    batteryCharge: string
    batteryDischarge: string
    ev: string
    gridExport: string
    gridImport: string
    grid: string
    home: string
    solar: string
  }
  solarProduction: {
    curve: number[]
    labels: string[]
    value: string
  }
}

type HistoricalEnergyDayProps = {
  currentDistribution: HistoricalEnergyDayResult['distribution']
  currentSolarProduction: HistoricalEnergyDayResult['solarProduction']
}

type HistoricalEnergyDayCacheEntry = {
  available: boolean
  distribution: HistoricalEnergyDayResult['distribution']
  solarProduction: HistoricalEnergyDayResult['solarProduction']
}

const EMPTY_DISTRIBUTION = {
  battery: '---',
  batteryCharge: '---',
  batteryDischarge: '---',
  ev: '---',
  gridExport: '---',
  gridImport: '---',
  grid: '---',
  home: '---',
  solar: '---',
}

const EMPTY_SOLAR_PRODUCTION = {
  curve: Array.from({ length: 24 }, () => 0),
  labels: Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`),
  value: '---',
}

export function useHistoricalEnergyDay({
  currentDistribution,
  currentSolarProduction,
}: HistoricalEnergyDayProps): HistoricalEnergyDayResult {
  const entities = useHass((state) => state.entities)
  const connection = useHass((state) => state.connection)
  const [dayOffset, setDayOffset] = useState(0)
  const [cache, setCache] = useState<Record<string, HistoricalEnergyDayCacheEntry>>({})
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])
  const entityIds = useMemo(
    () =>
      ({
        batteryPower: resolved.batteryPower?.entityId ?? null,
        batteryChargeToday: resolved.batteryChargeToday?.entityId ?? null,
        batteryDischargeToday: resolved.batteryDischargeToday?.entityId ?? null,
        evChargePower: resolved.evChargePower?.entityId ?? null,
        gridExportedToday: resolved.gridExportedToday?.entityId ?? null,
        gridImportToday: resolved.gridImportToday?.entityId ?? null,
        gridPower: resolved.gridPower?.entityId ?? null,
        homeEnergyToday: resolved.homeEnergyToday?.entityId ?? null,
        homePower: resolved.homePower?.entityId ?? null,
        solarProductionToday: resolved.solarProductionToday?.entityId ?? null,
        solarPower: resolved.solarPower?.entityId ?? null,
      }) satisfies Record<HistoryKey, string | null>,
    [
      resolved.batteryPower?.entityId,
      resolved.batteryChargeToday?.entityId,
      resolved.batteryDischargeToday?.entityId,
      resolved.evChargePower?.entityId,
      resolved.gridExportedToday?.entityId,
      resolved.gridImportToday?.entityId,
      resolved.gridPower?.entityId,
      resolved.homeEnergyToday?.entityId,
      resolved.homePower?.entityId,
      resolved.solarProductionToday?.entityId,
      resolved.solarPower?.entityId,
    ],
  )
  const sourceKey = useMemo(() => JSON.stringify(entityIds), [entityIds])

  useEffect(() => {
    if (dayOffset === 0) {
      return
    }

    const activeRequestEntries = (Object.entries(entityIds) as Array<[HistoryKey, string | null]>).filter(
      (entry): entry is [HistoryKey, string] => Boolean(entry[1]),
    )
    const activeEntityIds = activeRequestEntries.map(([, entityId]) => entityId)

    if (!activeEntityIds.length) {
      return
    }

    if (cache[getCacheKey(sourceKey, dayOffset)]) {
      return
    }

    const controller = new AbortController()
    const accessToken = import.meta.env.VITE_HA_TOKEN?.trim() || getConnectionAccessToken(connection)
    const apiBase = resolveHaApiBase()
    const { end, start } = getDayWindow(dayOffset)
    const cacheKey = getCacheKey(sourceKey, dayOffset)

    async function fetchHistory() {
      try {
        const rowsByKey = await fetchHistoryRowsByKey({
          abortSignal: controller.signal,
          accessToken,
          activeRequestEntries,
          apiBase,
          end,
          start,
        })
        const nextEntry = buildHistoricalDayEntry(rowsByKey, start, end)

        if (!controller.signal.aborted) {
          setCache((current) => ({
            ...current,
            [cacheKey]: nextEntry,
          }))
        }
      } catch {
        if (!controller.signal.aborted) {
          setCache((current) => ({
            ...current,
            [cacheKey]: {
              available: false,
              distribution: EMPTY_DISTRIBUTION,
              solarProduction: EMPTY_SOLAR_PRODUCTION,
            },
          }))
        }
      }
    }

    void fetchHistory()
    return () => controller.abort()
  }, [cache, connection, dayOffset, entityIds, sourceKey])

  const activeEntry = dayOffset === 0 ? null : cache[getCacheKey(sourceKey, dayOffset)] ?? null
  const hasActiveHistory = dayOffset > 0 && activeEntry?.available
  const isHistoricalSelection = dayOffset > 0

  return useMemo(
    () => ({
      controls: {
        canGoNext: dayOffset > 0,
        canGoPrevious: dayOffset < MAX_DAY_OFFSET,
        label: getDayControlLabel(dayOffset),
        onNext: () => setDayOffset((current) => Math.max(0, current - 1)),
        onPrevious: () => setDayOffset((current) => Math.min(MAX_DAY_OFFSET, current + 1)),
      },
      solarProduction: hasActiveHistory
        ? activeEntry.solarProduction
        : isHistoricalSelection && activeEntry
          ? EMPTY_SOLAR_PRODUCTION
          : currentSolarProduction,
      distribution:
        hasActiveHistory
          ? activeEntry.distribution
          : isHistoricalSelection && activeEntry
            ? EMPTY_DISTRIBUTION
            : currentDistribution,
    }),
    [activeEntry, currentDistribution, currentSolarProduction, dayOffset, hasActiveHistory, isHistoricalSelection],
  )
}

async function fetchHistoryRowsByKey({
  abortSignal,
  accessToken,
  activeRequestEntries,
  apiBase,
  end,
  start,
}: {
  abortSignal: AbortSignal
  accessToken?: string
  activeRequestEntries: Array<[HistoryKey, string]>
  apiBase: string
  end: Date
  start: Date
}) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  const rowsByKey = createEmptyHistoryRowsByKey()

  await Promise.all(
    activeRequestEntries.map(async ([key, entityId]) => {
      const url = `${apiBase}/api/history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${encodeURIComponent(entityId)}&end_time=${encodeURIComponent(end.toISOString())}&no_attributes`
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
        headers,
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error(`Historical energy day request failed for ${entityId} with ${response.status}`)
      }

      const payload: unknown = await response.json()
      const scale = ENERGY_ENTITY_NUMERIC_SCALE[key] ?? 1
      rowsByKey[key] = normalizeHistoryRows(extractSingleHistorySeries(payload), scale)
    }),
  )

  return rowsByKey
}

function createEmptyHistoryRowsByKey(): Record<HistoryKey, NormalizedHistoryRow[]> {
  return {
    batteryPower: [],
    batteryChargeToday: [],
    batteryDischargeToday: [],
    evChargePower: [],
    gridExportedToday: [],
    gridImportToday: [],
    gridPower: [],
    homeEnergyToday: [],
    homePower: [],
    solarProductionToday: [],
    solarPower: [],
  } satisfies Record<HistoryKey, NormalizedHistoryRow[]>
}

function extractSingleHistorySeries(payload: unknown) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return []
  }

  return payload[0]
}

function normalizeHistoryRows(payload: unknown, scale: number) {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const rawState = 'state' in item ? item.state : null
      const rawChanged = 'last_changed' in item ? item.last_changed : 'last_updated' in item ? item.last_updated : null
      const value = Number.parseFloat(String(rawState ?? '').replace(',', '.'))
      const changedMs = Date.parse(String(rawChanged ?? ''))

      if (!Number.isFinite(value) || !Number.isFinite(changedMs)) {
        return null
      }

      return {
        changedMs,
        value: value * scale,
      } satisfies NormalizedHistoryRow
    })
    .filter((item): item is NormalizedHistoryRow => Boolean(item))
    .sort((left, right) => left.changedMs - right.changedMs)
}

function buildHistoricalDayEntry(
  rowsByKey: Record<HistoryKey, NormalizedHistoryRow[]>,
  start: Date,
  end: Date,
): HistoricalEnergyDayCacheEntry {
  const startMs = start.getTime()
  const endMs = end.getTime()
  const solarRows = rowsByKey.solarPower
  const homeRows = rowsByKey.homePower
  const gridRows = rowsByKey.gridPower
  const batteryRows = rowsByKey.batteryPower
  const evRows = rowsByKey.evChargePower
  const gridExportTotalRows = rowsByKey.gridExportedToday
  const solarTotalRows = rowsByKey.solarProductionToday
  const homeTotalRows = rowsByKey.homeEnergyToday
  const gridTotalRows = rowsByKey.gridImportToday
  const batteryChargeTotalRows = rowsByKey.batteryChargeToday
  const batteryDischargeTotalRows = rowsByKey.batteryDischargeToday
  const solarTotal = integrateEnergy(rowsByKey.solarPower, startMs, endMs, (value) => Math.max(value, 0))
  const homeTotal = integrateEnergy(homeRows, startMs, endMs, (value) => Math.max(value, 0))
  const gridImportTotal = integrateEnergy(gridRows, startMs, endMs, (value) => Math.max(value, 0))
  const gridExportTotal = integrateEnergy(gridRows, startMs, endMs, (value) => Math.max(-value, 0))
  const batteryChargeTotal = integrateEnergy(batteryRows, startMs, endMs, (value) => Math.max(-value, 0))
  const batteryDischargeTotal = integrateEnergy(batteryRows, startMs, endMs, (value) => Math.max(value, 0))
  const evTotal = integrateEnergy(evRows, startMs, endMs, (value) => Math.max(value, 0))
  const hourlySolarCurve = buildHourlySolarCurve(solarRows, startMs)
  const solarDistributionTotal = getDailyTotalFromRows(solarTotalRows) ?? solarTotal
  const homeDistributionTotal = getDailyTotalFromRows(homeTotalRows) ?? homeTotal
  const gridExportDistributionTotal = getDailyTotalFromRows(gridExportTotalRows) ?? gridExportTotal
  const gridDistributionTotal = getDailyTotalFromRows(gridTotalRows) ?? gridImportTotal
  const batteryChargeDistributionTotal = getDailyTotalFromRows(batteryChargeTotalRows) ?? batteryChargeTotal
  const batteryDischargeDistributionTotal = getDailyTotalFromRows(batteryDischargeTotalRows) ?? batteryDischargeTotal
  const hasData = [
    solarRows,
    homeRows,
    gridRows,
    batteryRows,
    evRows,
    solarTotalRows,
    homeTotalRows,
    gridExportTotalRows,
    gridTotalRows,
    batteryChargeTotalRows,
    batteryDischargeTotalRows,
  ].some((rows) => rows.length > 0)

  return {
    available: hasData,
    distribution: {
      battery: formatKwh(Math.max(batteryChargeDistributionTotal, batteryDischargeDistributionTotal)),
      batteryCharge: formatKwh(batteryChargeDistributionTotal),
      batteryDischarge: formatKwh(batteryDischargeDistributionTotal),
      ev: formatKwh(evTotal),
      gridExport: formatKwh(gridExportDistributionTotal),
      gridImport: formatKwh(gridDistributionTotal),
      grid: formatKwh(gridDistributionTotal),
      home: formatKwh(homeDistributionTotal),
      solar: formatKwh(solarDistributionTotal),
    },
    solarProduction: {
      curve: hourlySolarCurve,
      labels: Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`),
      value: formatKwh(solarDistributionTotal),
    },
  }
}

function getDailyTotalFromRows(rows: NormalizedHistoryRow[]) {
  if (!rows.length) {
    return null
  }

  let maxValue = 0

  for (const row of rows) {
    maxValue = Math.max(maxValue, row.value)
  }

  return Number(maxValue.toFixed(2))
}

function integrateEnergy(
  rows: NormalizedHistoryRow[],
  windowStartMs: number,
  windowEndMs: number,
  transform: (value: number) => number,
) {
  if (!rows.length || windowEndMs <= windowStartMs) {
    return 0
  }

  let total = 0
  let currentValue = 0
  let currentStartMs = windowStartMs
  let cursor = 0

  while (cursor < rows.length && rows[cursor].changedMs <= windowStartMs) {
    currentValue = rows[cursor].value
    cursor += 1
  }

  for (; cursor < rows.length; cursor += 1) {
    const row = rows[cursor]
    const segmentEndMs = Math.min(row.changedMs, windowEndMs)

    if (segmentEndMs > currentStartMs) {
      total += transform(currentValue) * ((segmentEndMs - currentStartMs) / HOUR_MS)
    }

    if (row.changedMs >= windowEndMs) {
      break
    }

    currentValue = row.value
    currentStartMs = Math.max(currentStartMs, row.changedMs)
  }

  if (windowEndMs > currentStartMs) {
    total += transform(currentValue) * ((windowEndMs - currentStartMs) / HOUR_MS)
  }

  return Number(total.toFixed(2))
}

function buildHourlySolarCurve(rows: NormalizedHistoryRow[], windowStartMs: number) {
  return Array.from({ length: 24 }, (_, hour) => {
    const bucketStartMs = windowStartMs + hour * HOUR_MS
    const bucketEndMs = bucketStartMs + HOUR_MS
    return Number(integrateEnergy(rows, bucketStartMs, bucketEndMs, (value) => Math.max(value, 0)).toFixed(2))
  })
}

function getDayWindow(dayOffset: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { end, start }
}

function getDayKey(dayOffset: number) {
  const { start } = getDayWindow(dayOffset)
  return start.toISOString().slice(0, 10)
}

function getCacheKey(sourceKey: string, dayOffset: number) {
  return `${sourceKey}:${getDayKey(dayOffset)}`
}

function getDayControlLabel(dayOffset: number) {
  if (dayOffset === 0) {
    return 'Today'
  }

  const { start } = getDayWindow(dayOffset)
  return start.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
}

function formatKwh(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '---'
}
