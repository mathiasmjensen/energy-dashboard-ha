import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { ENERGY_ENTITIES } from '../data/energyEntities'
import { EVCC_CHARGE_MODES, type EvccChargeMode } from '../data/evcc'
import { useEvccChargeSessions } from './useEvccChargeSessions'
import type { PeakRateDay, PeakRateHour } from './usePeakRates'

export type EvChargerBottomMode = 'history' | 'plan'

export type EvPlanPriceHour = PeakRateHour & {
  disabled: boolean
  endMs: number
  index: number
  startMs: number
}

export type UseEvChargerControllerProps = {
  chargeMode: string
  chargeModeOptions: string[]
  chargePlanEnabled: boolean
  chargePlanFrom: string
  chargePlanTo: string
  priceAverage: string
  priceCurrent: string
  priceDays: PeakRateDay[]
  pricePeak: string
  priceSeries: number[]
}

export type EvChargerController = {
  bottomMode: EvChargerBottomMode
  isPlanEnabled: boolean
  modeOptions: typeof EVCC_CHARGE_MODES
  planFrom: string
  planEndMs: number
  planStatus: string
  planStartMs: number
  planTo: string
  planWindowLabel: string
  priceDayCount: number
  priceHours: EvPlanPriceHour[]
  priceSummary: {
    average: string
    current: string
    peak: string
  }
  safePriceDayIndex: number
  selectedMode: EvccChargeMode
  selectedPriceDay: PeakRateDay
  sessionHistory: ReturnType<typeof useEvccChargeSessions>
  setBottomMode: (mode: EvChargerBottomMode) => void
  handleModeChange: (mode: EvccChargeMode) => void
  handleNextPriceDay: () => void
  handlePlanEnabledChange: (enabled: boolean) => void
  handlePlanFromChange: (value: string) => void
  handlePlanToChange: (value: string) => void
  handlePreviousPriceDay: () => void
  handlePriceHourClick: (window: EvPlanPriceHour) => void
  handlePriceHourPointerDown: (window: EvPlanPriceHour) => void
  handlePriceHourPointerEnter: (window: EvPlanPriceHour) => void
  handlePriceHourPointerLeave: () => void
  handlePriceHourPointerUp: () => void
  handleSavePlan: () => void
}

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

function normalizeEvccMode(mode: string): EvccChargeMode {
  const normalizedMode = mode.toLowerCase().replace(/[\s_+-]/g, '')

  if (normalizedMode === 'off') {
    return 'off'
  }

  if (normalizedMode === 'now' || normalizedMode === 'fast') {
    return 'now'
  }

  if (normalizedMode === 'minpv' || normalizedMode === 'minpvcharging') {
    return 'minpv'
  }

  return 'pv'
}

function getEvccModeServiceOption(mode: EvccChargeMode, entityOptions: string[]) {
  return entityOptions.find((option) => normalizeEvccMode(option) === mode) ?? mode
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getNextFullHourMs(timestamp: number) {
  const date = new Date(timestamp)
  date.setMinutes(0, 0, 0)

  if (date.getTime() <= timestamp) {
    date.setHours(date.getHours() + 1)
  }

  return date.getTime()
}

function isClockValue(value: string) {
  return /^\d{2}:\d{2}$/.test(value)
}

function getClockParts(value: string) {
  const [hourValue, minuteValue] = value.split(':')
  const hour = Number.parseInt(hourValue, 10)
  const minute = Number.parseInt(minuteValue, 10)

  return {
    hour: Number.isInteger(hour) ? Math.min(23, Math.max(0, hour)) : 0,
    minute: Number.isInteger(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  }
}

function setDateClock(baseMs: number, value: string) {
  const { hour, minute } = getClockParts(value)
  const date = new Date(baseMs)
  date.setHours(hour, minute, 0, 0)

  return date.getTime()
}

function resolveFutureStartMs(value: string, earliestStartMs: number) {
  let startMs = setDateClock(earliestStartMs, value)

  while (startMs < earliestStartMs) {
    startMs += 24 * 60 * 60 * 1000
  }

  return startMs
}

function resolvePlanEndAfterStart(value: string, startMs: number) {
  let endMs = setDateClock(startMs, value)

  while (endMs <= startMs) {
    endMs += 24 * 60 * 60 * 1000
  }

  return endMs
}

function resolvePlanRange(from: string, to: string, earliestStartMs: number) {
  const startMs = resolveFutureStartMs(from, earliestStartMs)
  const endMs = resolvePlanEndAfterStart(to, startMs)

  return { endMs, startMs }
}

function formatClock(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

function formatShortDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
  })
}

function formatPlanRangeLabel(startMs: number, endMs: number) {
  const startDate = formatLocalDateKey(new Date(startMs))
  const endDate = formatLocalDateKey(new Date(endMs))
  const timeLabel = `${formatClock(startMs)} - ${formatClock(endMs)}`

  return startDate === endDate ? timeLabel : `${timeLabel} next day`
}

function getPriceWindowStartMs(price: PeakRateHour) {
  const isoMs = Date.parse(price.startIso)

  if (Number.isFinite(isoMs)) {
    return isoMs
  }

  const [year, month, day] = price.date.split('-').map(Number)
  return new Date(year, month - 1, day, price.hour, 0, 0, 0).getTime()
}

function getPriceWindowEndMs(price: PeakRateHour, startMs: number) {
  const isoMs = Date.parse(price.endIso)

  if (Number.isFinite(isoMs) && isoMs > startMs) {
    return isoMs
  }

  return startMs + 60 * 60 * 1000
}

function getAllPriceHours(priceDays: PeakRateDay[]) {
  return priceDays
    .flatMap((day) => day.prices)
    .map((price) => {
      const startMs = getPriceWindowStartMs(price)
      const endMs = getPriceWindowEndMs(price, startMs)

      return { ...price, endMs, startMs }
    })
    .sort((left, right) => left.startMs - right.startMs)
}

function createRollingPriceHours(priceDays: PeakRateDay[], fallbackPrices: number[], startMs: number): EvPlanPriceHour[] {
  const sourcePrices = getAllPriceHours(priceDays)

  return Array.from({ length: 24 }, (_, index) => {
    const bucketStartMs = startMs + index * 60 * 60 * 1000
    const bucketEndMs = bucketStartMs + 60 * 60 * 1000
    const sourcePrice = sourcePrices.find((price) => price.startMs <= bucketStartMs && bucketStartMs < price.endMs)
    const bucketDate = formatLocalDateKey(new Date(bucketStartMs))
    const bucketHour = new Date(bucketStartMs).getHours()
    const fallbackPrice = fallbackPrices[bucketHour % Math.max(1, fallbackPrices.length)] ?? 0

    return {
      date: bucketDate,
      disabled: bucketStartMs < startMs,
      endIso: new Date(bucketEndMs).toISOString(),
      endMs: bucketEndMs,
      hour: bucketHour,
      index,
      label: formatClock(bucketStartMs),
      price: sourcePrice?.price ?? fallbackPrice,
      startIso: new Date(bucketStartMs).toISOString(),
      startMs: bucketStartMs,
    }
  })
}

function createRollingPriceDay(priceHours: EvPlanPriceHour[]): PeakRateDay {
  const prices = priceHours.filter((price) => !price.disabled)
  const average = prices.length ? prices.reduce((sum, price) => sum + price.price, 0) / prices.length : null
  const peak = prices.length ? Math.max(...prices.map((price) => price.price)) : null
  const firstStartMs = prices[0]?.startMs ?? Date.now()
  const lastEndMs = prices[prices.length - 1]?.endMs ?? firstStartMs + 24 * 60 * 60 * 1000

  return {
    average: average === null ? null : average.toFixed(2),
    date: `${formatShortDate(firstStartMs)} - ${formatShortDate(lastEndMs)}`,
    label: 'Next 24 hours',
    peak: peak === null ? null : peak.toFixed(2),
    prices,
  }
}

function normalizeClockValue(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : fallback
}
