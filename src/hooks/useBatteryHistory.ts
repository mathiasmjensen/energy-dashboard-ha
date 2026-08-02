import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import type { BatteryHistoryPeriod, BatteryHistoryResult } from '../models/batteryHistory'
import { resolveHaAccessToken, resolveHaApiBase } from '../services/haApi'
import {
  buildBatteryHistorySeriesFromStates,
  getEmptyBatteryHistorySeries,
  normalizeBatteryHistoryStates,
} from '../services/batteryHistory'

const HISTORY_LOOKBACK_DAYS = 90

export function useBatteryHistory(fallbackSocValue: number): BatteryHistoryResult {
  const entities = useHass((state) => state.entities)
  const connection = useHass((state) => state.connection)
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])
  const batterySocEntityIds = useMemo(() => {
    const predbatSocEntityIds = Object.keys(entities).filter(
      (entityId) => entityId.startsWith('sensor.predbat_') && entityId.includes('_soc'),
    )
    const fallbackEntityIds = [
      'sensor.foxess_battery_soc',
      'sensor.foxess_battery_state_of_charge',
      'sensor.foxess_inverter_battery_soc',
      'sensor.evcc_battery_soc',
      ...predbatSocEntityIds,
    ]

    return [...new Set([resolved.batterySoc?.entityId, ...fallbackEntityIds].filter((entityId): entityId is string => Boolean(entityId)))]
  }, [entities, resolved.batterySoc?.entityId])
  const batterySocEntitySignature = batterySocEntityIds.join('|')
  const apiBase = resolveHaApiBase()
  const accessToken = resolveHaAccessToken(connection)
  const [historyState, setHistoryState] = useState<{
    error: string | null
    entityId: string | null
    states: ReturnType<typeof normalizeBatteryHistoryStates>
  }>({ entityId: null, error: null, states: [] })
  const [nowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!batterySocEntityIds.length) {
      return
    }

    const controller = new AbortController()
    const startDate = new Date(Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const endDate = new Date().toISOString()
    async function fetchHistory() {
      const failures: string[] = []

      try {
        for (const entityId of batterySocEntityIds) {
          const url = `${apiBase}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${encodeURIComponent(entityId)}&end_time=${encodeURIComponent(endDate)}&no_attributes`
          const response = await fetch(url, {
            cache: 'no-store',
            credentials: 'include',
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            signal: controller.signal,
          })

          if (!response.ok) {
            failures.push(`${entityId}: ${response.status}`)
            continue
          }

          const payload: unknown = await response.json()
          const nextStates = normalizeBatteryHistoryStates(payload)

          if (!nextStates.length) {
            failures.push(`${entityId}: no usable states`)
            continue
          }

          setHistoryState({
            entityId,
            error: null,
            states: nextStates,
          })
          return
        }

        setHistoryState({
          entityId: null,
          error: `No recorded states for battery SoC (${failures.join(', ')})`,
          states: [],
        })
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : 'Battery history could not be loaded'
          console.warn('[battery-history]', message)
          setHistoryState({
            entityId: null,
            error: message,
            states: [],
          })
        }
      }
    }

    void fetchHistory()

    return () => controller.abort()
  }, [accessToken, apiBase, batterySocEntityIds, batterySocEntitySignature])

  return useMemo(() => {
    const activeStates = historyState.entityId && batterySocEntityIds.includes(historyState.entityId) ? historyState.states : []
    const getSeries = (period: BatteryHistoryPeriod) =>
      activeStates.length
        ? buildBatteryHistorySeriesFromStates(activeStates, period, nowMs, fallbackSocValue)
        : getEmptyBatteryHistorySeries(period)

    return {
      day: getSeries('24h'),
      error: activeStates.length ? null : historyState.error,
      month: getSeries('30d'),
      quarter: getSeries('90d'),
      source: activeStates.length ? 'ha' : 'unavailable',
      week: getSeries('7d'),
    }
  }, [batterySocEntityIds, fallbackSocValue, historyState.entityId, historyState.error, historyState.states, nowMs])
}
