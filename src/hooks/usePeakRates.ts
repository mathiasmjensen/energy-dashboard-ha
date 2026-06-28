import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import type { PeakRateResult, PeakRateWindow } from '../models/peakRates'
import { getRawEntityState, getResolvedEntity } from '../services/energyEntityFormatting'
import {
  getPeakRatePayloadFromAttributes,
  getPeakRateResult,
  getPeakRateUrl,
  normalizePeakRates,
} from '../services/peakRates'

const POLL_MS = 15 * 60 * 1000
const TICK_MS = 60 * 1000

export function usePeakRates(): PeakRateResult {
  const entities = useHass((state) => state.entities)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [windows, setWindows] = useState<PeakRateWindow[]>([])
  const [error, setError] = useState(false)
  const peakRateUrl = getPeakRateUrl()
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])
  const haWindows = useMemo(() => {
    const entity = getResolvedEntity(resolved, 'peakRateFeed')
    const payload = getPeakRatePayloadFromAttributes(
      (entity?.attributes ?? {}) as Record<string, unknown>,
      getRawEntityState(resolved, 'peakRateFeed'),
    )

    return normalizePeakRates(payload)
  }, [resolved])

  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), TICK_MS)

    return () => window.clearInterval(tickId)
  }, [])

  useEffect(() => {
    if (!peakRateUrl) {
      return
    }

    const controller = new AbortController()

    async function fetchPeakRates() {
      try {
        const response = await fetch(peakRateUrl, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Peak rate request failed with ${response.status}`)
        }

        const payload: unknown = await response.json()
        const nextWindows = normalizePeakRates(payload)

        if (!nextWindows.length) {
          throw new Error('Peak rate response did not contain usable windows')
        }

        setWindows(nextWindows)
        setError(false)
      } catch {
        if (!controller.signal.aborted) {
          setError(true)
        }
      }
    }

    void fetchPeakRates()
    const pollId = window.setInterval(fetchPeakRates, POLL_MS)

    return () => {
      controller.abort()
      window.clearInterval(pollId)
    }
  }, [peakRateUrl])

  return useMemo(
    () => getPeakRateResult(haWindows.length ? haWindows : peakRateUrl ? windows : [], nowMs, peakRateUrl ? error : false),
    [error, haWindows, nowMs, peakRateUrl, windows],
  )
}
