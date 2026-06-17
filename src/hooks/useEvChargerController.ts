import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { ENERGY_ENTITIES } from '../data/energyEntities'
import { EVCC_CHARGE_MODES, type EvccChargeMode } from '../data/evcc'
import { useEvccChargeSessions } from './useEvccChargeSessions'
import type { PeakRateDay, PeakRateHour } from './usePeakRates'

export type EvChargerBottomMode = 'history' | 'plan'

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
  planStatus: string
  planTo: string
  planWindowLabel: string
  priceDayCount: number
  priceHours: PeakRateHour[]
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
  handlePriceHourClick: (hour: number) => void
  handlePriceHourPointerDown: (hour: number) => void
  handlePriceHourPointerEnter: (hour: number) => void
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
  const [planFrom, setPlanFrom] = useState(() => normalizeClockValue(chargePlanFrom, '22:00'))
  const [planTo, setPlanTo] = useState(() => normalizeClockValue(chargePlanTo, '06:00'))
  const [isPlanEnabled, setIsPlanEnabled] = useState(chargePlanEnabled)
  const [planStatus, setPlanStatus] = useState('Ready to save plan')
  const [chartAnchorHour, setChartAnchorHour] = useState<number | null>(null)
  const [dragStartHour, setDragStartHour] = useState<number | null>(null)
  const [didDragChart, setDidDragChart] = useState(false)
  const [selectedPriceDayIndex, setSelectedPriceDayIndex] = useState(0)
  const canCallService = ready && Boolean(connection)
  const todayDateKey = formatLocalDateKey(new Date())
  const todayPriceDayIndex = priceDays.findIndex((day) => day.date === todayDateKey)
  const safePriceDayIndex =
    todayPriceDayIndex >= 0
      ? Math.min(Math.max(selectedPriceDayIndex, todayPriceDayIndex), priceDays.length - 1)
      : Math.min(selectedPriceDayIndex, Math.max(0, priceDays.length - 1))
  const selectedPriceDay = priceDays[safePriceDayIndex] ?? createEmptyPriceDay()

  useEffect(() => {
    setSelectedMode(normalizeEvccMode(chargeMode))
  }, [chargeMode])

  useEffect(() => {
    setPlanFrom(normalizeClockValue(chargePlanFrom, '22:00'))
  }, [chargePlanFrom])

  useEffect(() => {
    setPlanTo(normalizeClockValue(chargePlanTo, '06:00'))
  }, [chargePlanTo])

  useEffect(() => {
    setIsPlanEnabled(chargePlanEnabled)
  }, [chargePlanEnabled])

  useEffect(() => {
    if (todayPriceDayIndex >= 0) {
      setSelectedPriceDayIndex(todayPriceDayIndex)
    }
  }, [todayPriceDayIndex])

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

    const startDate = selectedPriceDay.date
    const endDate = getPlanEndDate(startDate, planFrom, planTo)
    const plan = {
      active: isPlanEnabled,
      date: startDate,
      day: startDate,
      enabled: isPlanEnabled,
      end: planTo,
      end_date: endDate,
      end_time: planTo,
      from: planFrom,
      mode_at_end: 'pv',
      mode_at_start: 'now',
      start: planFrom,
      start_date: startDate,
      start_time: planFrom,
      to: planTo,
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

    setPlanStatus(`Plan saved ${selectedPriceDay.label} ${planFrom} - ${planTo}`)
  }, [callService, canCallService, entityExists, isPlanEnabled, planFrom, planTo, selectedPriceDay.date, selectedPriceDay.label])

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

  const applyChartWindow = useCallback((fromHour: number, toHour: number) => {
    setPlanFrom(formatHour(fromHour))
    setPlanTo(formatHour(toHour))
    setPlanStatus('Unsaved chart selection')
  }, [])

  const handlePriceHourClick = useCallback(
    (hour: number) => {
      if (didDragChart) {
        setDidDragChart(false)
        setChartAnchorHour(null)
        return
      }

      if (chartAnchorHour === null) {
        setChartAnchorHour(hour)
        applyChartWindow(hour, hour + 1)
        return
      }

      applyChartWindow(chartAnchorHour, hour + 1)
      setChartAnchorHour(null)
    },
    [applyChartWindow, chartAnchorHour, didDragChart],
  )

  const handlePriceHourPointerDown = useCallback(
    (hour: number) => {
      setDragStartHour(hour)
      setDidDragChart(false)
      applyChartWindow(hour, hour + 1)
    },
    [applyChartWindow],
  )

  const handlePriceHourPointerEnter = useCallback(
    (hour: number) => {
      if (dragStartHour === null) {
        return
      }

      if (hour !== dragStartHour) {
        setDidDragChart(true)
      }

      applyChartWindow(dragStartHour, hour + 1)
    },
    [applyChartWindow, dragStartHour],
  )

  const handlePriceHourPointerUp = useCallback(() => {
    setDragStartHour(null)
  }, [])

  const handlePlanFromChange = useCallback((value: string) => {
    setPlanFrom(value)
    setPlanStatus('Unsaved changes')
  }, [])

  const handlePlanToChange = useCallback((value: string) => {
    setPlanTo(value)
    setPlanStatus('Unsaved changes')
  }, [])

  const handleSavePlan = useCallback(() => {
    callInputBoolean(ENERGY_ENTITIES.evccChargePlanEnabled, isPlanEnabled)
    callChargePlanScript()
  }, [callChargePlanScript, callInputBoolean, isPlanEnabled])

  const handlePriceHourPointerLeave = useCallback(() => {
    setDragStartHour(null)
  }, [])

  const handlePreviousPriceDay = useCallback(() => {
    setSelectedPriceDayIndex((current) => Math.max(0, current - 1))
    setChartAnchorHour(null)
    setDragStartHour(null)
    setPlanStatus('Reviewing previous price day')
  }, [])

  const handleNextPriceDay = useCallback(() => {
    setSelectedPriceDayIndex((current) => Math.min(Math.max(0, priceDays.length - 1), current + 1))
    setChartAnchorHour(null)
    setDragStartHour(null)
    setPlanStatus('Reviewing next price day')
  }, [priceDays.length])

  const priceSummary = useMemo(
    () => ({
      average: selectedPriceDay.average ?? priceAverage,
      current: priceCurrent,
      peak: selectedPriceDay.peak ?? pricePeak,
    }),
    [priceAverage, priceCurrent, pricePeak, selectedPriceDay.average, selectedPriceDay.peak],
  )

  const priceHours = useMemo(
    () =>
      selectedPriceDay.prices.length
        ? selectedPriceDay.prices
        : numbersToPriceHours(priceSeries, todayDateKey),
    [priceSeries, selectedPriceDay.prices, todayDateKey],
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
    planStatus,
    planTo,
    planWindowLabel: `${planFrom} - ${planTo}`,
    priceDayCount: priceDays.length,
    priceHours,
    priceSummary,
    safePriceDayIndex,
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

function getHour(value: string) {
  const hour = Number.parseInt(value.slice(0, 2), 10)
  return Number.isInteger(hour) ? Math.min(23, Math.max(0, hour)) : 0
}

function formatHour(hour: number) {
  const normalizedHour = ((hour % 24) + 24) % 24
  return `${normalizedHour.toString().padStart(2, '0')}:00`
}

function createEmptyPriceDay(date = formatLocalDateKey(new Date())): PeakRateDay {
  return {
    average: null,
    date,
    label: 'Today',
    peak: null,
    prices: [],
  }
}

function numbersToPriceHours(prices: number[], date: string): PeakRateHour[] {
  return prices.slice(0, 24).map((price, hour) => ({
    date,
    endIso: '',
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    price,
    startIso: '',
  }))
}

function getPlanEndDate(startDate: string, planFrom: string, planTo: string) {
  if (getHour(planTo) > getHour(planFrom)) {
    return startDate
  }

  const [year, month, day] = startDate.split('-').map(Number)
  const endDate = new Date(year, month - 1, day + 1)

  return formatLocalDateKey(endDate)
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeClockValue(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : fallback
}
