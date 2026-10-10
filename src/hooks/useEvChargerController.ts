import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { ENERGY_ENTITIES } from '../data/energyEntities'
import { EVCC_CHARGE_MODES, getEvccModeServiceOption, normalizeEvccMode } from '../data/evcc'
import type { EvChargerBottomMode, EvChargerController, EvPlanPriceHour, UseEvChargerControllerProps } from '../models/evChargePlan'
import type { EvccChargeMode } from '../models/evcc'
import {
  createRollingPriceDay,
  createRollingPriceHours,
  formatClock,
  formatLocalDateKey,
  formatPlanRangeLabel,
  getCurrentHourMs,
  getNextSafePlanStartMs,
  isClockValue,
  normalizeClockValue,
  resolvePlanEndAfterStart,
  resolvePlanRange,
} from '../services/evChargePlan'
import { useEvccChargeSessions } from './useEvccChargeSessions'

type PlanRange = {
  endMs: number
  startMs: number
}

function getPersistedPlanRange(startMs: number | null, endMs: number | null): PlanRange | null {
  if (startMs === null || endMs === null || endMs <= startMs || endMs <= Date.now()) {
    return null
  }

  return { endMs, startMs }
}

function isSamePlanRange(left: PlanRange, right: PlanRange) {
  const minuteMs = 60_000

  return Math.abs(left.startMs - right.startMs) < minuteMs && Math.abs(left.endMs - right.endMs) < minuteMs
}

function getHaPlanWindowLabel(
  persistedRange: PlanRange | null,
  chargePlanFrom: string,
  chargePlanTo: string,
) {
  if (persistedRange) {
    return formatPlanRangeLabel(persistedRange.startMs, persistedRange.endMs)
  }

  return `${normalizeClockValue(chargePlanFrom, '--:--')} - ${normalizeClockValue(chargePlanTo, '--:--')}`
}

export function useEvChargerController({
  chargeMode,
  chargeModeOptions,
  chargePlanEnabled,
  chargePlanEndMs,
  chargePlanFrom,
  chargePlanStartMs,
  chargePlanTo,
  priceAverage,
  priceCurrent,
  priceDays,
  pricePeak,
  priceSeries,
}: UseEvChargerControllerProps): EvChargerController {
  const entities = useHass((state) => state.entities)
  const connection = useHass((state) => state.connection)
  const ready = useHass((state) => state.ready)
  const callService = useHass((state) => state.helpers.callService)
  const sessionHistory = useEvccChargeSessions()
  const [selectedMode, setSelectedMode] = useState<EvccChargeMode>(() => normalizeEvccMode(chargeMode))
  const [bottomMode, setBottomMode] = useState<EvChargerBottomMode>('plan')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const currentHourMs = useMemo(() => getCurrentHourMs(nowMs), [nowMs])
  const earliestPlanStartMs = useMemo(() => getNextSafePlanStartMs(nowMs), [nowMs])
  const [planFrom, setPlanFrom] = useState(() => normalizeClockValue(chargePlanFrom, '22:00'))
  const [planTo, setPlanTo] = useState(() => normalizeClockValue(chargePlanTo, '06:00'))
  const [planRange, setPlanRange] = useState(() => {
    const persistedRange = getPersistedPlanRange(chargePlanStartMs, chargePlanEndMs)

    if (persistedRange) {
      return persistedRange
    }

    return resolvePlanRange(
      normalizeClockValue(chargePlanFrom, '22:00'),
      normalizeClockValue(chargePlanTo, '06:00'),
      getNextSafePlanStartMs(Date.now()),
    )
  })
  const [isPlanEnabled, setIsPlanEnabled] = useState(chargePlanEnabled)
  const [planStatus, setPlanStatus] = useState('Ready to save plan')
  const [pendingPlanRange, setPendingPlanRange] = useState<PlanRange | null>(null)
  const [chartAnchorMs, setChartAnchorMs] = useState<number | null>(null)
  const [dragStartMs, setDragStartMs] = useState<number | null>(null)
  const [didDragChart, setDidDragChart] = useState(false)
  const canCallService = ready && Boolean(connection)
  const persistedPlanRange = useMemo(
    () => getPersistedPlanRange(chargePlanStartMs, chargePlanEndMs),
    [chargePlanEndMs, chargePlanStartMs],
  )
  const haPlanWindowLabel = useMemo(
    () => getHaPlanWindowLabel(persistedPlanRange, chargePlanFrom, chargePlanTo),
    [chargePlanFrom, chargePlanTo, persistedPlanRange],
  )

  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), 60_000)

    return () => window.clearInterval(tickId)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- HA entity updates need to resync these editable form controls. */
  useEffect(() => {
    setSelectedMode(normalizeEvccMode(chargeMode))
  }, [chargeMode])

  useEffect(() => {
    if (!persistedPlanRange) {
      return
    }

    if (pendingPlanRange) {
      if (!isSamePlanRange(persistedPlanRange, pendingPlanRange)) {
        return
      }

      setPendingPlanRange(null)
      setPlanStatus(`Plan confirmed ${formatPlanRangeLabel(persistedPlanRange.startMs, persistedPlanRange.endMs)}`)
    }

    setPlanRange(persistedPlanRange)
    setPlanFrom(formatClock(persistedPlanRange.startMs))
    setPlanTo(formatClock(persistedPlanRange.endMs))
  }, [pendingPlanRange, persistedPlanRange])

  useEffect(() => {
    if (!pendingPlanRange) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setPlanStatus('Waiting for Home Assistant to confirm the saved plan')
    }, 12_000)

    return () => window.clearTimeout(timeoutId)
  }, [pendingPlanRange])

  useEffect(() => {
    setIsPlanEnabled(chargePlanEnabled)
  }, [chargePlanEnabled])
  /* eslint-enable react-hooks/set-state-in-effect */

  const entityExists = useCallback((entityId: string) => Boolean(entities[entityId]), [entities])

  const callSelectOption = useCallback(
    (entityId: string, option: string) => {
      if (!canCallService || !entityExists(entityId)) {
        return
      }

      if (entityId.startsWith('input_select.')) {
        callService({
          domain: 'input_select',
          service: 'select_option',
          serviceData: { option },
          target: entityId,
        })
        return
      }

      callService({
        domain: 'select',
        service: 'select_option',
        serviceData: { option },
        target: entityId,
      })
    },
    [callService, canCallService, entityExists],
  )

  const callInputBoolean = useCallback(
    (entityId: string, enabled: boolean) => {
      if (!canCallService || !entityExists(entityId)) {
        return
      }

      callService({
        domain: 'input_boolean',
        service: enabled ? 'turn_on' : 'turn_off',
        target: entityId,
      })
    },
    [callService, canCallService, entityExists],
  )

  const callRestCommand = useCallback(
    (service: 'evcc_disable_charge' | 'evcc_enable_charge') => {
      if (!canCallService) {
        return
      }

      callService({
        domain: 'rest_command',
        service: service as never,
      })
    },
    [callService, canCallService],
  )

  const saveChargePlan = useCallback(() => {
    const startEntityId = ENERGY_ENTITIES.evccChargePlanStart
    const endEntityId = ENERGY_ENTITIES.evccChargePlanEnd

    if (!canCallService || !entityExists(startEntityId) || !entityExists(endEntityId)) {
      setPlanStatus('Add the EVCC charge start and end helpers in Home Assistant')
      return
    }

    const start = new Date(planRange.startMs)
    const end = new Date(planRange.endMs)

    setPendingPlanRange({ ...planRange })
    setPlanStatus(`Saving ${formatPlanRangeLabel(planRange.startMs, planRange.endMs)}…`)

    // Persist the two HA helpers directly. The start/stop automations watch
    // these entities, so no script-variable handoff is needed for a plan save.
    callService({
      domain: 'input_datetime',
      service: 'set_datetime',
      serviceData: {
        date: formatLocalDateKey(start),
        time: `${formatClock(planRange.startMs)}:00`,
      },
      target: startEntityId,
    })
    callService({
      domain: 'input_datetime',
      service: 'set_datetime',
      serviceData: {
        date: formatLocalDateKey(end),
        time: `${formatClock(planRange.endMs)}:00`,
      },
      target: endEntityId,
    })
    callInputBoolean(ENERGY_ENTITIES.evccChargePlanEnabled, isPlanEnabled)
  }, [callInputBoolean, callService, canCallService, entityExists, isPlanEnabled, planRange])

  const handleModeChange = useCallback(
    (mode: EvccChargeMode) => {
      setSelectedMode(mode)
      callSelectOption(ENERGY_ENTITIES.evccLoadpointMode, getEvccModeServiceOption(mode, chargeModeOptions))
    },
    [callSelectOption, chargeModeOptions],
  )

  const handlePlanEnabledChange = useCallback(
    (enabled: boolean) => {
      setIsPlanEnabled(enabled)
      callInputBoolean(ENERGY_ENTITIES.evccChargePlanEnabled, enabled)

      if (!enabled) {
        callSelectOption(ENERGY_ENTITIES.evccLoadpointMode, getEvccModeServiceOption('pv', chargeModeOptions))
        callRestCommand('evcc_disable_charge')
        setPlanStatus('Plan disabled and charger returned to solar')
        return
      }

      setPlanStatus('Plan enabled')
    },
    [callInputBoolean, callRestCommand, callSelectOption, chargeModeOptions],
  )

  const applyChartWindow = useCallback((startMs: number, endMs: number) => {
    setPendingPlanRange(null)
    setPlanRange({ endMs, startMs })
    setPlanFrom(formatClock(startMs))
    setPlanTo(formatClock(endMs))
    setPlanStatus('Unsaved chart selection')
  }, [])

  const handlePriceHourClick = useCallback(
    (window: EvPlanPriceHour) => {
      if (window.disabled) {
        return
      }

      if (didDragChart) {
        setDidDragChart(false)
        setChartAnchorMs(null)
        return
      }

      const selectableStartMs = Math.max(window.startMs, earliestPlanStartMs)

      if (selectableStartMs >= window.endMs) {
        return
      }

      if (chartAnchorMs === null) {
        setChartAnchorMs(selectableStartMs)
        applyChartWindow(selectableStartMs, window.endMs)
        return
      }

      if (selectableStartMs <= chartAnchorMs) {
        setChartAnchorMs(null)
        applyChartWindow(selectableStartMs, window.endMs)
        return
      }

      applyChartWindow(chartAnchorMs, window.startMs)
      setChartAnchorMs(null)
    },
    [applyChartWindow, chartAnchorMs, didDragChart, earliestPlanStartMs],
  )

  const handlePriceHourPointerDown = useCallback(
    (window: EvPlanPriceHour) => {
      if (window.disabled) {
        return
      }

      const selectableStartMs = Math.max(window.startMs, earliestPlanStartMs)
      if (selectableStartMs >= window.endMs) {
        return
      }

      setDragStartMs(selectableStartMs)
      setDidDragChart(false)
      applyChartWindow(selectableStartMs, window.endMs)
    },
    [applyChartWindow, earliestPlanStartMs],
  )

  const handlePriceHourPointerEnter = useCallback(
    (window: EvPlanPriceHour) => {
      if (dragStartMs === null || window.disabled) {
        return
      }

      if (window.startMs !== dragStartMs) {
        setDidDragChart(true)
      }

      if (window.startMs > dragStartMs) {
        applyChartWindow(dragStartMs, window.startMs)
      }
    },
    [applyChartWindow, dragStartMs],
  )

  const handlePriceHourPointerUp = useCallback(() => {
    setDragStartMs(null)
  }, [])

  const handlePlanFromChange = useCallback((value: string) => {
    setPendingPlanRange(null)
    setPlanFrom(value)
    if (isClockValue(value)) {
      const nextRange = resolvePlanRange(value, planTo, earliestPlanStartMs)
      setPlanRange(nextRange)
      setPlanTo(formatClock(nextRange.endMs))
    }
    setPlanStatus('Unsaved changes')
    setChartAnchorMs(null)
  }, [earliestPlanStartMs, planTo])

  const handlePlanToChange = useCallback((value: string) => {
    setPendingPlanRange(null)
    setPlanTo(value)
    if (isClockValue(value)) {
      const endMs = resolvePlanEndAfterStart(value, planRange.startMs)
      setPlanRange((current) => ({ ...current, endMs }))
      setPlanTo(formatClock(endMs))
    }
    setPlanStatus('Unsaved changes')
    setChartAnchorMs(null)
  }, [planRange.startMs])

  const handleSavePlan = useCallback(() => {
    saveChargePlan()
  }, [saveChargePlan])

  const handlePriceHourPointerLeave = useCallback(() => {
    setDragStartMs(null)
  }, [])

  const priceHours = useMemo(
    () => createRollingPriceHours(priceDays, priceSeries, currentHourMs),
    [currentHourMs, priceDays, priceSeries],
  )

  const selectedPriceDay = useMemo(() => createRollingPriceDay(priceHours), [priceHours])

  const priceSummary = useMemo(
    () => ({
      average: selectedPriceDay.average ?? priceAverage,
      current: priceCurrent,
      peak: selectedPriceDay.peak ?? pricePeak,
    }),
    [priceAverage, priceCurrent, pricePeak, selectedPriceDay.average, selectedPriceDay.peak],
  )

  return {
    bottomMode,
    handleModeChange,
    handlePlanEnabledChange,
    handlePlanFromChange,
    handlePlanToChange,
    handlePriceHourClick,
    handlePriceHourPointerDown,
    handlePriceHourPointerEnter,
    handlePriceHourPointerLeave,
    handlePriceHourPointerUp,
    handleSavePlan,
    isPlanEnabled,
    modeOptions: EVCC_CHARGE_MODES,
    earliestPlanStartMs,
    haPlanWindowLabel,
    isPlanPendingConfirmation: pendingPlanRange !== null,
    nowMs,
    planFrom,
    planEndMs: planRange.endMs,
    planStatus,
    planStartMs: planRange.startMs,
    planTo,
    planWindowLabel: formatPlanRangeLabel(planRange.startMs, planRange.endMs),
    priceHours,
    priceSummary,
    selectedMode,
    selectedPriceDay,
    sessionHistory,
    setBottomMode,
  }
}
