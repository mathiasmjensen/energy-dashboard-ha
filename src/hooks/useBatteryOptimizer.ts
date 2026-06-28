import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBatteryOptimizerClient } from '../services/batteryOptimizerClient'
import {
  createMockBatteryOptimizerSnapshot,
  getBatteryOptimizerMode,
  isBatteryOptimizerStale,
  normalizeBatteryOptimizerSnapshot,
  type BatteryOptimizerLiveInputs,
  type BatteryOptimizerSettings,
  type BatteryOptimizerSnapshot,
} from '../services/batteryOptimizer'

export type BatteryOptimizerState = {
  errorMessage: string | null
  hasLiveError: boolean
  isApplyingPlan: boolean
  isEmpty: boolean
  isLoading: boolean
  isPausing: boolean
  isRefreshing: boolean
  isSavingSettings: boolean
  isStale: boolean
  mode: 'direct-api' | 'ha-proxy' | 'mock'
  retry: () => void
  snapshot: BatteryOptimizerSnapshot | null
  updateSetting: <TKey extends keyof BatteryOptimizerSettings>(key: TKey, value: BatteryOptimizerSettings[TKey]) => void
  applyPlan: () => void
  pauseUntilTomorrow: () => void
  refresh: () => void
}

export function useBatteryOptimizer(inputs: BatteryOptimizerLiveInputs): BatteryOptimizerState {
  const mode = getBatteryOptimizerMode()
  const client = createBatteryOptimizerClient()
  const inputSignature = useMemo(
    () =>
      JSON.stringify({
        batteryPowerKw: inputs.batteryPowerKw,
        batterySocPercent: inputs.batterySocPercent,
        batteryStatus: inputs.batteryStatus,
        currentPriceDkkPerKwh: inputs.currentPriceDkkPerKwh,
        gridPowerKw: inputs.gridPowerKw,
        peakRateDays: inputs.peakRateDays.map((day) => ({
          average: day.average,
          date: day.date,
          peak: day.peak,
          prices: day.prices.map((price) => ({
            endIso: price.endIso,
            price: price.price,
            startIso: price.startIso,
          })),
        })),
        solarForecastWindows: inputs.solarForecastWindows.map((window) => ({
          endTime: window.endTime,
          kwh: window.kwh,
          powerKw: window.powerKw,
          time: window.time,
        })),
      }),
    [
      inputs.batteryPowerKw,
      inputs.batterySocPercent,
      inputs.batteryStatus,
      inputs.currentPriceDkkPerKwh,
      inputs.gridPowerKw,
      inputs.peakRateDays,
      inputs.solarForecastWindows,
    ],
  )
  const stableInputs = useMemo(() => JSON.parse(inputSignature) as BatteryOptimizerLiveInputs, [inputSignature])
  const [snapshot, setSnapshot] = useState<BatteryOptimizerSnapshot | null>(() =>
    mode === 'mock' ? createMockBatteryOptimizerSnapshot(stableInputs) : null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasLiveError, setHasLiveError] = useState(false)
  const [isLoading, setIsLoading] = useState(mode !== 'mock')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isApplyingPlan, setIsApplyingPlan] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (mode === 'mock' || !client) {
        setSnapshot(createMockBatteryOptimizerSnapshot(stableInputs))
        setErrorMessage(null)
        setHasLiveError(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const [statusPayload, planPayload, settingsPayload] = await Promise.all([
          client.getStatus(),
          client.getPlan(),
          client.getSettings(),
        ])

        if (cancelled) {
          return
        }

        setSnapshot(
          normalizeBatteryOptimizerSnapshot({
            inputs: stableInputs,
            planPayload,
            settingsPayload,
            source: 'live',
            statusPayload,
          }),
        )
        setErrorMessage(null)
        setHasLiveError(false)
      } catch (error) {
        if (cancelled) {
          return
        }

        setSnapshot(createMockBatteryOptimizerSnapshot(stableInputs))
        setErrorMessage(error instanceof Error ? error.message : 'Battery optimizer backend unavailable')
        setHasLiveError(true)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [client, mode, reloadToken, stableInputs])

  const refresh = useCallback(async () => {
    if (mode === 'mock' || !client) {
      setSnapshot(createMockBatteryOptimizerSnapshot(stableInputs))
      setErrorMessage(null)
      setHasLiveError(false)
      return
    }

    setIsRefreshing(true)
    try {
      await client.refresh()
      setReloadToken((current) => current + 1)
      setErrorMessage(null)
      setHasLiveError(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not refresh optimizer')
      setHasLiveError(true)
    } finally {
      setIsRefreshing(false)
    }
  }, [client, mode, stableInputs])

  const applyPlan = useCallback(async () => {
    if (!snapshot) {
      return
    }

    if (mode === 'mock' || !client) {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              status: {
                ...current.status,
                updatedAt: new Date().toISOString(),
              },
            }
          : current,
      )
      return
    }

    setIsApplyingPlan(true)
    try {
      await client.applyPlan({
        planRows: snapshot.planRows,
        settings: snapshot.settings,
      })
      setReloadToken((current) => current + 1)
      setErrorMessage(null)
      setHasLiveError(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not apply optimized plan')
      setHasLiveError(true)
    } finally {
      setIsApplyingPlan(false)
    }
  }, [client, mode, snapshot])

  const pauseUntilTomorrow = useCallback(async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    if (mode === 'mock' || !client) {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              settings: {
                ...current.settings,
                pausedUntil: tomorrow.toISOString(),
              },
            }
          : current,
      )
      return
    }

    setIsPausing(true)
    try {
      await client.pauseUntilTomorrow({ untilIso: tomorrow.toISOString() })
      setReloadToken((current) => current + 1)
      setErrorMessage(null)
      setHasLiveError(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not pause optimizer')
      setHasLiveError(true)
    } finally {
      setIsPausing(false)
    }
  }, [client, mode])

  const updateSetting = useCallback(
    <TKey extends keyof BatteryOptimizerSettings>(key: TKey, value: BatteryOptimizerSettings[TKey]) => {
      setSnapshot((current) =>
        current
          ? {
              ...current,
              settings: {
                ...current.settings,
                [key]: value,
              },
              status: {
                ...current.status,
                mode:
                  key === 'autoMode'
                    ? (value ? 'auto' : 'manual')
                    : current.status.mode,
              },
            }
          : current,
      )

      if (mode === 'mock' || !client || !snapshot) {
        return
      }

      const nextSettings = {
        ...snapshot.settings,
        [key]: value,
      }

      setIsSavingSettings(true)
      void client
        .saveSettings(nextSettings)
        .then(() => {
          setErrorMessage(null)
          setHasLiveError(false)
        })
        .catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : 'Could not save optimizer settings')
          setHasLiveError(true)
        })
        .finally(() => {
          setIsSavingSettings(false)
        })
    },
    [client, mode, snapshot],
  )

  return {
    applyPlan,
    errorMessage,
    hasLiveError,
    isApplyingPlan,
    isEmpty: !snapshot || snapshot.planRows.length === 0,
    isLoading,
    isPausing,
    isRefreshing,
    isSavingSettings,
    isStale: snapshot ? isBatteryOptimizerStale(snapshot.status.updatedAt) : false,
    mode,
    pauseUntilTomorrow,
    refresh,
    retry: () => setReloadToken((current) => current + 1),
    snapshot,
    updateSetting,
  }
}
