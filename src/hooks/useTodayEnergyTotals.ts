import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { getNumericState } from '../services/energyEntityFormatting'
import {
  formatKwh,
  getInitialTodayEnergyTotals,
  getMidnightIso,
  integrateHistorySeries,
  readTodayEnergyTotalsCache,
  type HistoryRow,
  type TodayEnergyTotals,
  writeTodayEnergyTotalsCache,
} from '../services/todayEnergyTotals'

const CACHE_MS = 5 * 60 * 1000
const POLL_MS = 5 * 60 * 1000

export function useTodayEnergyTotals() {
  const entities = useHass((state) => state.entities)
  const connection = useHass((state) => state.connection)
  const [totals, setTotals] = useState<TodayEnergyTotals>(getInitialTodayEnergyTotals)
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])

  useEffect(() => {
    const accessToken = connection?.options?.auth?.accessToken

    if (!accessToken) {
      return
    }

    const controller = new AbortController()

    async function fetchTotals() {
      const now = new Date()
      const cached = readTodayEnergyTotalsCache(now)
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
        writeTodayEnergyTotalsCache(now, nextTotals)
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
          payload.filter((rows) => rows.length > 0).map((rows) => [rows[0].entity_id ?? '', rows]),
        )

        const nextTotals = {
          evKwh: formatKwh(
            integrateHistorySeries(series.get(resolvedEvPowerId) ?? [], nowMs, (value) => Math.max(0, value)),
          ),
          gridKwh:
            directGridKwh !== null
              ? formatKwh(directGridKwh)
              : formatKwh(
                  integrateHistorySeries(series.get(resolvedGridPowerId) ?? [], nowMs, (value) =>
                    Math.max(0, value),
                  ),
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
        writeTodayEnergyTotalsCache(now, nextTotals)
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
