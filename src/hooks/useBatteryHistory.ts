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
  const batterySocEntityId = resolved.batterySoc?.entityId ?? null
  const [historyState, setHistoryState] = useState<{
    error: string | null
    entityId: string | null
    states: ReturnType<typeof normalizeBatteryHistoryStates>
  }>({ entityId: null, error: null, states: [] })
  const [nowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!batterySocEntityId) {
      return
    }

    const controller = new AbortController()
    const startDate = new Date(Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const endDate = new Date().toISOString()
    const apiBase = resolveHaApiBase()
    const url = `${apiBase}/api/history/period/${encodeURIComponent(startDate)}?filter_entity_id=${encodeURIComponent(batterySocEntityId)}&end_time=${encodeURIComponent(endDate)}&minimal_response&no_attributes`
    const accessToken = resolveHaAccessToken(connection)

    async function fetchHistory() {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Battery history request failed with ${response.status}`)
        }

        const payload: unknown = await response.json()
        const nextStates = normalizeBatteryHistoryStates(payload)

        if (!nextStates.length) {
          throw new Error('Battery history response did not contain usable states')
        }

        setHistoryState({
          entityId: batterySocEntityId,
          error: null,
          states: nextStates,
        })
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : 'Battery history could not be loaded'
          console.warn('[battery-history]', message)
          setHistoryState({
            entityId: batterySocEntityId,
            error: message,
            states: [],
          })
        }
      }
    }

    void fetchHistory()

    return () => controller.abort()
  }, [batterySocEntityId, connection, historyState.entityId])

  return useMemo(() => {
    const activeStates = historyState.entityId === batterySocEntityId ? historyState.states : []
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
  }, [batterySocEntityId, fallbackSocValue, historyState.entityId, historyState.error, historyState.states, nowMs])
}
