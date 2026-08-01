import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import type { BatteryOptimizerLiveInputs, BatteryOptimizerSettings, BatteryOptimizerSnapshot, BatteryOptimizerState } from '../models/batteryOptimizer'
import { createMockBatteryOptimizerSnapshot, isBatteryOptimizerStale, normalizeBatteryOptimizerSnapshot } from '../services/batteryOptimizer'
import {
  buildPredbatSnapshotPayloads,
  getPredbatControlModeOption,
  getPredbatMonitorModeOption,
  hasPredbatData,
  resolvePredbatEntities,
} from '../services/predbat'

export function usePredbatBatteryOptimizer(inputs: BatteryOptimizerLiveInputs, enabled: boolean): BatteryOptimizerState {
  const entities = useHass((state) => state.entities)
  const ready = useHass((state) => state.ready)
  const callService = useHass((state) => state.helpers.callService)
  const resolved = useMemo(() => resolvePredbatEntities(entities), [entities])
  const inputSignature = useMemo(
    () =>
      JSON.stringify({
        batteryPowerKw: inputs.batteryPowerKw,
        batterySocPercent: inputs.batterySocPercent,
        batteryStatus: inputs.batteryStatus,
        currentPriceDkkPerKwh: inputs.currentPriceDkkPerKwh,
        gridPowerKw: inputs.gridPowerKw,
        peakRateDays: inputs.peakRateDays,
        solarForecastWindows: inputs.solarForecastWindows,
      }),
    [inputs],
  )
  const stableInputs = useMemo(() => JSON.parse(inputSignature) as BatteryOptimizerLiveInputs, [inputSignature])
  const liveSnapshot = useMemo<BatteryOptimizerSnapshot | null>(() => {
    if (!enabled || !hasPredbatData(resolved)) {
      return null
    }

    const payloads = buildPredbatSnapshotPayloads(resolved, stableInputs)
    return normalizeBatteryOptimizerSnapshot({
      inputs: stableInputs,
      planPayload: payloads.planPayload,
      settingsPayload: payloads.settingsPayload,
      source: 'live',
      statusPayload: payloads.statusPayload,
    })
  }, [enabled, resolved, stableInputs])

  const [snapshot, setSnapshot] = useState<BatteryOptimizerSnapshot | null>(() =>
    liveSnapshot ?? createMockBatteryOptimizerSnapshot(stableInputs),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasLiveError, setHasLiveError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isApplyingPlan, setIsApplyingPlan] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isPausing, setIsPausing] = useState(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (liveSnapshot) {
      setSnapshot(liveSnapshot)
      setErrorMessage(null)
      setHasLiveError(false)
      return
    }

    setSnapshot(createMockBatteryOptimizerSnapshot(stableInputs))
    setErrorMessage('Predbat entities not found in Home Assistant yet')
    setHasLiveError(true)
  }, [enabled, liveSnapshot, stableInputs])

  const entityExists = useCallback(
    (entityId: string | undefined | null) => (entityId ? Boolean(entities[entityId]) : false),
    [entities],
  )

  const callSelectOption = useCallback(
    (entityId: string | undefined, option: string) => {
      if (!ready || !entityId || !entityExists(entityId)) {
        return false
      }

      const domain = entityId.startsWith('input_select.') ? 'input_select' : 'select'
      callService({
        domain,
        service: 'select_option',
        serviceData: { option },
        target: entityId,
      })
      return true
    },
    [callService, entityExists, ready],
  )

  const callBooleanEntity = useCallback(
    (entityId: string | undefined, enabledValue: boolean) => {
      if (!ready || !entityId || !entityExists(entityId)) {
        return false
      }

      const domain = entityId.split('.', 1)[0]
      if (domain !== 'switch' && domain !== 'input_boolean') {
        return false
      }

      callService({
        domain,
        service: enabledValue ? 'turn_on' : 'turn_off',
        target: entityId,
      })
      return true
    },
    [callService, entityExists, ready],
  )

  const callNumberEntity = useCallback(
    (entityId: string | undefined, value: number) => {
      if (!ready || !entityId || !entityExists(entityId)) {
        return false
      }

      const domain = entityId.split('.', 1)[0]
      if (domain !== 'input_number' && domain !== 'number') {
        return false
      }

      callService({
        domain,
        service: 'set_value',
        serviceData: { value } as never,
        target: entityId,
      })
      return true
    },
    [callService, entityExists, ready],
  )

  const callDateTimeEntity = useCallback(
    (entityId: string | undefined, iso: string | null) => {
      if (!ready || !entityId || !entityExists(entityId) || !iso) {
        return false
      }

      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) {
        return false
      }

      callService({
        domain: 'input_datetime',
        service: 'set_datetime',
        serviceData: {
          datetime: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`,
        },
        target: entityId,
      })

      return true
    },
    [callService, entityExists, ready],
  )

  const callScript = useCallback(
    (entityId: string | undefined) => {
      if (!ready || !entityId || !entityExists(entityId)) {
        return false
      }

      callService({
        domain: 'script',
        service: 'turn_on',
        target: entityId,
      })
      return true
    },
    [callService, entityExists, ready],
  )

  const updateEntities = useCallback(() => {
    const targetIds = [
      resolved.planSensor?.entityId,
      resolved.statusSensor?.entityId,
      resolved.updatedAtSensor?.entityId,
      resolved.recommendationSensor?.entityId,
      resolved.spotPriceSensor?.entityId,
      resolved.fullBuyPriceSensor?.entityId,
      resolved.sellPriceSensor?.entityId,
      resolved.profitTodaySensor?.entityId,
    ].filter((value): value is string => Boolean(value))

    if (!ready || !targetIds.length) {
      return false
    }

    targetIds.forEach((entityId) => {
      callService({
        domain: 'homeassistant',
        service: 'update_entity',
        target: entityId,
      })
    })
    return true
  }, [callService, ready, resolved])

  const refresh = useCallback(async () => {
    if (!enabled) {
      return
    }

    setIsRefreshing(true)
    try {
      const triggered = callScript(resolved.refreshScript?.entityId) || updateEntities()
      if (!triggered) {
        setErrorMessage('Predbat refresh script or entities are not available')
        setHasLiveError(true)
      } else {
        setErrorMessage(null)
        setHasLiveError(false)
      }
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 300)
    }
  }, [callScript, enabled, resolved.refreshScript?.entityId, updateEntities])

  const applyPlan = useCallback(async () => {
    if (!enabled) {
      return
    }

    setIsApplyingPlan(true)
    try {
      const scriptTriggered = callScript(resolved.applyPlanScript?.entityId)
      const readOnlyCleared = callBooleanEntity(resolved.readOnlySwitch?.entityId, false)
      const activeEnabled = callBooleanEntity(resolved.activeSwitch?.entityId, true)
      const modeSelected = callSelectOption(resolved.modeSelect?.entityId, getPredbatControlModeOption())

      if (!(scriptTriggered || readOnlyCleared || activeEnabled || modeSelected)) {
        setErrorMessage('Predbat apply-plan controls are not available')
        setHasLiveError(true)
      } else {
        setErrorMessage(null)
        setHasLiveError(false)
      }
    } finally {
      window.setTimeout(() => setIsApplyingPlan(false), 300)
    }
  }, [
    callBooleanEntity,
    callScript,
    callSelectOption,
    enabled,
    resolved.activeSwitch?.entityId,
    resolved.applyPlanScript?.entityId,
    resolved.modeSelect?.entityId,
    resolved.readOnlySwitch?.entityId,
  ])

  const pauseUntilTomorrow = useCallback(async () => {
    if (!enabled) {
      return
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    setIsPausing(true)
    try {
      const scriptTriggered = callScript(resolved.pauseScript?.entityId)
      const helperSet = callDateTimeEntity(resolved.pausedUntilHelper?.entityId, tomorrow.toISOString())
      const readOnlyEnabled = callBooleanEntity(resolved.readOnlySwitch?.entityId, true)
      const monitorSet = callSelectOption(resolved.modeSelect?.entityId, getPredbatMonitorModeOption())

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

      if (!(scriptTriggered || helperSet || readOnlyEnabled || monitorSet)) {
        setErrorMessage('Predbat pause controls are not available')
        setHasLiveError(true)
      } else {
        setErrorMessage(null)
        setHasLiveError(false)
      }
    } finally {
      window.setTimeout(() => setIsPausing(false), 300)
    }
  }, [
    callBooleanEntity,
    callDateTimeEntity,
    callScript,
    callSelectOption,
    enabled,
    resolved.modeSelect?.entityId,
    resolved.pauseScript?.entityId,
    resolved.pausedUntilHelper?.entityId,
    resolved.readOnlySwitch?.entityId,
  ])

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
                mode: key === 'autoMode' ? (value ? 'auto' : 'manual') : current.status.mode,
              },
            }
          : current,
      )

      if (!enabled) {
        return
      }

      setIsSavingSettings(true)

      try {
        let didApply = false

        if (key === 'autoMode') {
          didApply =
            callSelectOption(resolved.modeSelect?.entityId, value ? getPredbatControlModeOption() : getPredbatMonitorModeOption()) ||
            callBooleanEntity(resolved.activeSwitch?.entityId, Boolean(value)) ||
            didApply
          if (value) {
            didApply = callBooleanEntity(resolved.readOnlySwitch?.entityId, false) || didApply
          }
        } else if (key === 'dryRun') {
          didApply = callBooleanEntity(resolved.readOnlySwitch?.entityId, Boolean(value))
        } else if (key === 'allowBatteryExport') {
          didApply = callBooleanEntity(resolved.allowBatteryExportSwitch?.entityId, Boolean(value))
        } else if (key === 'allowGridCharging') {
          didApply = callBooleanEntity(resolved.allowGridChargingSwitch?.entityId, Boolean(value))
        } else if (key === 'minReservePercent') {
          didApply = callNumberEntity(resolved.reserveInput?.entityId, Number(value))
        } else if (key === 'maxGridChargeKwh') {
          didApply = callNumberEntity(resolved.maxGridChargeInput?.entityId, Number(value))
        }

        if (!didApply) {
          setErrorMessage(`Predbat setting "${String(key)}" is not configured in Home Assistant`)
          setHasLiveError(true)
        } else {
          setErrorMessage(null)
          setHasLiveError(false)
        }
      } finally {
        window.setTimeout(() => setIsSavingSettings(false), 250)
      }
    },
    [
      callBooleanEntity,
      callNumberEntity,
      callSelectOption,
      enabled,
      resolved.activeSwitch?.entityId,
      resolved.allowBatteryExportSwitch?.entityId,
      resolved.allowGridChargingSwitch?.entityId,
      resolved.maxGridChargeInput?.entityId,
      resolved.modeSelect?.entityId,
      resolved.readOnlySwitch?.entityId,
      resolved.reserveInput?.entityId,
    ],
  )

  return {
    applyPlan,
    errorMessage,
    hasLiveError,
    isApplyingPlan,
    isEmpty: !snapshot || snapshot.planRows.length === 0,
    isLoading: enabled && !liveSnapshot && !snapshot,
    isPausing,
    isRefreshing,
    isSavingSettings,
    isStale: snapshot ? isBatteryOptimizerStale(snapshot.status.updatedAt) : false,
    mode: 'predbat',
    pauseUntilTomorrow,
    refresh,
    retry: () => {
      if (liveSnapshot) {
        setSnapshot(liveSnapshot)
        setErrorMessage(null)
        setHasLiveError(false)
      }
    },
    snapshot,
    updateSetting,
  }
}
