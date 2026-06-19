import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { getRawEntityState, getResolvedEntity } from '../services/energyEntityFormatting'
import {
  getEvccSolarForecastUrl,
  getForecastResult,
  getInitialSolarForecastState,
  getPanelCapacityKw,
  getSolarForecastStateFromAttributes,
  getSolarForecastUrl,
  normalizeEvccForecast,
  normalizeForecast,
  readEvccSolarCache,
  type EvccSolarPayload,
  type OpenMeteoPayload,
  type SolarForecastResult,
  type SolarForecastState,
  writeEvccSolarCache,
} from '../services/solarForecast'

export type { SolarForecastResult, SolarForecastWindow } from '../services/solarForecast'

const EVCC_SOLAR_CACHE_MS = 30 * 60 * 1000
const POLL_MS = 60 * 60 * 1000
const EVCC_POLL_MS = 15 * 60 * 1000

export function useSolarForecast(): SolarForecastResult {
  const entities = useHass((state) => state.entities)
  const evccForecastUrl = getEvccSolarForecastUrl()
  const [forecastState, setForecastState] = useState<SolarForecastState>(() => getInitialSolarForecastState(evccForecastUrl))
  const forecastUrl = getSolarForecastUrl()
  const panelCapacityKw = getPanelCapacityKw()
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])
  const haForecastState = useMemo(() => {
    const entity = getResolvedEntity(resolved, 'solarForecastFeed')

    return getSolarForecastStateFromAttributes(
      (entity?.attributes ?? {}) as Record<string, unknown>,
      getRawEntityState(resolved, 'solarForecastFeed'),
      panelCapacityKw,
    )
  }, [panelCapacityKw, resolved])
  const hasHaForecast = haForecastState.windows.length > 0

  useEffect(() => {
    if (!evccForecastUrl || hasHaForecast) {
      return
    }

    const controller = new AbortController()

    async function fetchEvccSolarForecast() {
      const cached = readEvccSolarCache()

      if (cached && Date.now() - cached.createdAt < EVCC_SOLAR_CACHE_MS) {
        setForecastState({ source: 'evcc', windows: cached.windows })
        return
      }

      try {
        const response = await fetch(evccForecastUrl, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`EVCC solar forecast request failed with ${response.status}`)
        }

        const payload = (await response.json()) as EvccSolarPayload
        const nextWindows = normalizeEvccForecast(payload)

        if (!nextWindows.length) {
          throw new Error('EVCC solar forecast response did not contain usable rates')
        }

        setForecastState({ source: 'evcc', windows: nextWindows })
        writeEvccSolarCache(nextWindows)
      } catch {
        if (!controller.signal.aborted && cached?.windows.length) {
          setForecastState({ source: 'evcc', windows: cached.windows })
        }
      }
    }

    void fetchEvccSolarForecast()
    const pollId = window.setInterval(fetchEvccSolarForecast, EVCC_POLL_MS)

    return () => {
      controller.abort()
      window.clearInterval(pollId)
    }
  }, [evccForecastUrl, hasHaForecast])

  useEffect(() => {
    if (!forecastUrl || evccForecastUrl || hasHaForecast) {
      return
    }

    const controller = new AbortController()

    async function fetchSolarForecast() {
      try {
        const response = await fetch(forecastUrl, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Open-Meteo request failed with ${response.status}`)
        }

        const payload = (await response.json()) as OpenMeteoPayload
        setForecastState({ source: 'open-meteo', windows: normalizeForecast(payload, panelCapacityKw) })
      } catch {
        if (!controller.signal.aborted) {
          setForecastState({ source: 'open-meteo', windows: [] })
        }
      }
    }

    void fetchSolarForecast()
    const pollId = window.setInterval(fetchSolarForecast, POLL_MS)

    return () => {
      controller.abort()
      window.clearInterval(pollId)
    }
  }, [evccForecastUrl, forecastUrl, hasHaForecast, panelCapacityKw])

  return useMemo(
    () =>
      hasHaForecast
        ? getForecastResult(haForecastState.windows, haForecastState.source)
        : getForecastResult(forecastState.windows, forecastState.source),
    [forecastState, haForecastState, hasHaForecast],
  )
}
