import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { type ResolvedEnergyEntities, resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { type EnergyEntityKey } from '../data/energyEntities'

const CACHE_MS = 5 * 60 * 1000
const POLL_MS = 5 * 60 * 1000
const CACHE_KEY_PREFIX = 'energy-dashboard:today-energy-totals:'

type HistoryRow = {
  attributes?: {
    unit_of_measurement?: string
  }
  entity_id?: string
  last_changed: string
  state: string
}

type TodayEnergyTotals = {
  evKwh: string
  gridKwh: string
  homeKwh: string
}

type TodayEnergyTotalsCache = {
  createdAt: number
  totals: TodayEnergyTotals
}

function getCacheKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${CACHE_KEY_PREFIX}${year}-${month}-${day}`
}

function readCache(date: Date) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(date))
    const parsed = raw ? (JSON.parse(raw) as TodayEnergyTotalsCache) : null
    return parsed?.totals ? parsed : null
  } catch {
    return null
  }
}

function writeCache(date: Date, totals: TodayEnergyTotals) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getCacheKey(date),
      JSON.stringify({
        createdAt: Date.now(),
        totals,
      } satisfies TodayEnergyTotalsCache),
    )
  } catch {
    // localStorage can be unavailable in hardened browsers.
  }
}

function getInitialState() {
  const cache = readCache(new Date())

  return cache?.totals ?? {
    evKwh: '---',
    gridKwh: '---',
    homeKwh: '---',
  }
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function integrateHistorySeries(rows: HistoryRow[], nowMs: number, clamp: (value: number) => number) {
  if (!rows.length) {
    return 0
  }

  const unit = rows[0]?.attributes?.unit_of_measurement ?? ''
  const scale = unit === 'W' ? 0.001 : 1
  let sumKwh = 0

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const startMs = Date.parse(row.last_changed)
    const endMs =
      index + 1 < rows.length ? Date.parse(rows[index + 1].last_changed) : nowMs
    const durationHours = Math.max(0, endMs - startMs) / 3_600_000
    const value = parseNumber(row.state)

    if (value === null || durationHours <= 0) {
      continue
    }

    sumKwh += clamp(value * scale) * durationHours
  }

  return sumKwh
}

function formatKwh(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : '---'
}

function getNumericState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const state = resolved[key]?.entity.state?.trim()

  if (!state) {
    return null
  }

  const parsed = Number.parseFloat(state.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function getMidnightIso(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

export function useTodayEnergyTotals() {
  const entities = useHass((state) => state.entities)
  const connection = useHass((state) => state.connection)
  const [totals, setTotals] = useState<TodayEnergyTotals>(getInitialState)
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])

  useEffect(() => {
    const accessToken = connection?.options?.auth?.accessToken

    if (!accessToken) {
      return
    }

    const controller = new AbortController()

    async function fetchTotals() {
      const now = new Date()
      const cached = readCache(now)
      const directHomeKwh = getNumericState(resolved, 'homeEnergyToday')
      const directGridKwh = getNumericState(resolved, 'gridImportToday')
      const resolvedHomePowerId = resolved.homePower?.entityId ?? 'sensor.evcc_home_power'
      const resolvedGridPowerId = resolved.gridPower?.entityId ?? 'sensor.evcc_grid_power'
      const resolvedEvPowerId = resolved.evChargePower?.entityId ?? 'sensor.evcc_carport_charge_power'

      if (directHomeKwh !== null || directGridKwh !== null) {
        const nextTotals = {
          evKwh: cached?.totals.evKwh ?? '---',
          gridKwh: formatKwh(directGridKwh ?? 0),
          homeKwh: formatKwh(directHomeKwh ?? 0),
        }

        setTotals(nextTotals)
        writeCache(now, nextTotals)
      }

      if (cached && Date.now() - cached.createdAt < CACHE_MS) {
        setTotals(cached.totals)
        return
      }

      try {
        const entityIds = [resolvedHomePowerId, resolvedGridPowerId, resolvedEvPowerId].join(',')
        const start = getMidnightIso(now)
        const response = await fetch(
          `/api/history/period/${start}?filter_entity_id=${encodeURIComponent(entityIds)}&minimal_response&no_attributes`,
          {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error(`History request failed with ${response.status}`)
        }

        const payload = (await response.json()) as HistoryRow[][]
        const nowMs = Date.now()
        const series = new Map(
          payload
            .filter((rows) => rows.length > 0)
            .map((rows) => [rows[0].entity_id ?? '', rows]),
        )

        const nextTotals = {
          evKwh: formatKwh(
            integrateHistorySeries(series.get(resolvedEvPowerId) ?? [], nowMs, (value) =>
              Math.max(0, value),
            ),
          ),
          gridKwh:
            directGridKwh !== null
              ? formatKwh(directGridKwh)
              : formatKwh(
                  integrateHistorySeries(series.get(resolvedGridPowerId) ?? [], nowMs, (value) => Math.max(0, value)),
                ),
          homeKwh:
            directHomeKwh !== null
              ? formatKwh(directHomeKwh)
              : formatKwh(
                  integrateHistorySeries(series.get(resolvedHomePowerId) ?? [], nowMs, (value) =>
              Math.max(0, value),
            ),
                ),
        }

        setTotals(nextTotals)
        writeCache(now, nextTotals)
      } catch {
        if (!controller.signal.aborted && cached?.totals) {
          setTotals(cached.totals)
        }
      }
    }

    void fetchTotals()
    const pollId = window.setInterval(fetchTotals, POLL_MS)

    return () => {
      controller.abort()
      window.clearInterval(pollId)
    }
  }, [connection, resolved])

  return useMemo(() => totals, [totals])
}
