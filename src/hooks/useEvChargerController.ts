import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { ENERGY_ENTITIES } from '../data/energyEntities'
import { EVCC_CHARGE_MODES, getEvccModeServiceOption, normalizeEvccMode } from '../data/evcc'
import type { EvChargerBottomMode, EvChargerController, EvPlanPriceHour, UseEvChargerControllerProps } from '../models/evChargePlan'
import type { EvccChargeMode } from '../models/evcc'
import type { PeakRateDay } from '../models/peakRates'
import {
  createRollingPriceDay,
  createRollingPriceHours,
  formatClock,
  formatLocalDateKey,
  formatPlanRangeLabel,
  getNextFullHourMs,
  isClockValue,
  normalizeClockValue,
  resolvePlanEndAfterStart,
  resolvePlanRange,
} from '../services/evChargePlan'
import { useEvccChargeSessions } from './useEvccChargeSessions'

export function useEvChargerController({
  chargeMode,
  chargeModeOptions,
  chargePlanEnabled,
  chargePlanFrom,
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
  const nextFullHourMs = useMemo(() => getNextFullHourMs(nowMs), [nowMs])
  const [planFrom, setPlanFrom] = useState(() => normalizeClockValue(chargePlanFrom, '22:00'))
  const [planTo, setPlanTo] = useState(() => normalizeClockValue(chargePlanTo, '06:00'))
  const [planRange, setPlanRange] = useState(() =>
    resolvePlanRange(normalizeClockValue(chargePlanFrom, '22:00'), normalizeClockValue(chargePlanTo, '06:00'), getNextFullHourMs(Date.now())),
  )
  const [isPlanEnabled, setIsPlanEnabled] = useState(chargePlanEnabled)
  const [planStatus, setPlanStatus] = useState('Ready to save plan')
  const [chartAnchorMs, setChartAnchorMs] = useState<number | null>(null)
  const [dragStartMs, setDragStartMs] = useState<number | null>(null)
  const [didDragChart, setDidDragChart] = useState(false)
  const canCallService = ready && Boolean(connection)

  useEffect(() => {
    const tickId = window.setInterval(() => setNowMs(Date.now()), 60_000)

    return () => window.clearInterval(tickId)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- HA entity updates need to resync these editable form controls. */
  useEffect(() => {
    setSelectedMode(normalizeEvccMode(chargeMode))
  }, [chargeMode])

  useEffect(() => {
    const nextFrom = normalizeClockValue(chargePlanFrom, '22:00')
    setPlanFrom(nextFrom)
    setPlanRange((current) => resolvePlanRange(nextFrom, formatClock(current.endMs), getNextFullHourMs(Date.now())))
  }, [chargePlanFrom])

  useEffect(() => {
    const nextTo = normalizeClockValue(chargePlanTo, '06:00')
    setPlanTo(nextTo)
    setPlanRange((current) => resolvePlanRange(formatClock(current.startMs), nextTo, getNextFullHourMs(Date.now())))
  }, [chargePlanTo])

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

  const callChargePlanScript = useCallback(() => {
    const entityId = ENERGY_ENTITIES.evccSetChargePlanScript

    if (!canCallService || !entityExists(entityId)) {
      setPlanStatus('Add script.evcc_set_charge_plan in Home Assistant')
      return
    }

    const startDate = formatLocalDateKey(new Date(planRange.startMs))
    const endDate = formatLocalDateKey(new Date(planRange.endMs))
    const startTime = formatClock(planRange.startMs)
    const endTime = formatClock(planRange.endMs)
    const plan = {
      active: isPlanEnabled,
      date: startDate,
      day: startDate,
      enabled: isPlanEnabled,
      end: endTime,
      end_date: endDate,
      end_time: endTime,
      from: startTime,
      mode_at_end: 'pv',
      mode_at_start: 'now',
      start: startTime,
      start_date: startDate,
      start_time: startTime,
      to: endTime,
    }

    callService({
      domain: 'script',
      service: 'turn_on',
      serviceData: {
        variables: {
          charge_plan: plan,
          plan: {
            ...plan,
            id: 'manual-charge-window',
          },
        },
      },
      target: entityId,
    })

    setPlanStatus(`Plan saved ${formatPlanRangeLabel(planRange.startMs, planRange.endMs)}`)
  }, [callService, canCallService, entityExists, isPlanEnabled, planRange.endMs, planRange.startMs])

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

      if (chartAnchorMs === null) {
        setChartAnchorMs(window.startMs)
        applyChartWindow(window.startMs, window.endMs)
        return
      }

      if (window.startMs <= chartAnchorMs) {
        setChartAnchorMs(null)
        applyChartWindow(window.startMs, window.endMs)
        return
      }

      applyChartWindow(chartAnchorMs, window.startMs)
      setChartAnchorMs(null)
    },
    [applyChartWindow, chartAnchorMs, didDragChart],
  )

  const handlePriceHourPointerDown = useCallback(
    (window: EvPlanPriceHour) => {
      if (window.disabled) {
        return
      }

      setDragStartMs(window.startMs)
      setDidDragChart(false)
      applyChartWindow(window.startMs, window.endMs)
    },
    [applyChartWindow],
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
    setPlanFrom(value)
    if (isClockValue(value)) {
      const nextRange = resolvePlanRange(value, planTo, nextFullHourMs)
      setPlanRange(nextRange)
      setPlanTo(formatClock(nextRange.endMs))
    }
    setPlanStatus('Unsaved changes')
    setChartAnchorMs(null)
  }, [nextFullHourMs, planTo])

  const handlePlanToChange = useCallback((value: string) => {
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
    callInputBoolean(ENERGY_ENTITIES.evccChargePlanEnabled, isPlanEnabled)
    callChargePlanScript()
  }, [callChargePlanScript, callInputBoolean, isPlanEnabled])

  const handlePriceHourPointerLeave = useCallback(() => {
    setDragStartMs(null)
  }, [])

  const handlePreviousPriceDay = useCallback(() => {
    setChartAnchorMs(null)
    setDragStartMs(null)
  }, [])

  const handleNextPriceDay = useCallback(() => {
    setChartAnchorMs(null)
    setDragStartMs(null)
  }, [])

  const priceHours = useMemo(
    () => createRollingPriceHours(priceDays, priceSeries, nextFullHourMs),
    [nextFullHourMs, priceDays, priceSeries],
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
    handleNextPriceDay,
    handlePlanEnabledChange,
    handlePlanFromChange,
    handlePlanToChange,
    handlePreviousPriceDay,
    handlePriceHourClick,
    handlePriceHourPointerDown,
    handlePriceHourPointerEnter,
    handlePriceHourPointerLeave,
    handlePriceHourPointerUp,
    handleSavePlan,
    isPlanEnabled,
    modeOptions: EVCC_CHARGE_MODES,
    planFrom,
    planEndMs: planRange.endMs,
    planStatus,
    planStartMs: planRange.startMs,
    planTo,
    planWindowLabel: formatPlanRangeLabel(planRange.startMs, planRange.endMs),
    priceDayCount: 1,
    priceHours,
    priceSummary,
    safePriceDayIndex: 0,
    selectedMode,
    selectedPriceDay,
    sessionHistory,
    setBottomMode,
  }
}
