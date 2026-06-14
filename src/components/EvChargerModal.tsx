import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, ChangeEvent, PointerEvent, ReactNode } from 'react'
import { useHass } from '@hakit/core'
import { ENERGY_ENTITIES } from '../data/energyEntities'
import { EVCC_CHARGE_MODES, type EvccChargeMode } from '../data/evcc'
import { useEvccChargeSessions } from '../hooks/useEvccChargeSessions'
import type { PeakRateDay, PeakRateHour } from '../hooks/usePeakRates'
import { assetPath } from '../utils/assetPath'

type EvChargerModalProps = {
  chargeMode: string
  chargeModeOptions: string[]
  chargePlanEnabled: boolean
  chargePlanFrom: string
  chargePlanTo: string
  chargeRate: string
  onClose: () => void
  priceAverage: string
  priceCurrent: string
  priceDays: PeakRateDay[]
  pricePeak: string
  priceSeries: number[]
  sessionDuration: string
  sessionEnergy: string
  status: string
}

const DASH = '---'
type EvChargerBottomMode = 'history' | 'plan'

export function EvChargerModal({
  chargeMode,
  chargeModeOptions,
  chargePlanEnabled,
  chargePlanFrom,
  chargePlanTo,
  chargeRate,
  onClose,
  priceAverage,
  priceCurrent,
  priceDays,
  pricePeak,
  priceSeries,
  sessionDuration,
  sessionEnergy,
  status,
}: EvChargerModalProps) {
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
  const safePriceDayIndex = todayPriceDayIndex >= 0 ? todayPriceDayIndex : Math.min(selectedPriceDayIndex, Math.max(0, priceDays.length - 1))

  
  const selectedPriceDay = priceDays[safePriceDayIndex] ?? createEmptyPriceDay()
  const selectedDayAverage = selectedPriceDay.average ?? priceAverage
  const selectedDayPeak = selectedPriceDay.peak ?? pricePeak

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const modeOptions = EVCC_CHARGE_MODES

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
          target: entityId,
          serviceData: { option },
        })
        return
      }

      callService({
        domain: 'select',
        service: 'select_option',
        target: entityId,
        serviceData: { option },
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
      end: planTo,
      end_date: endDate,
      end_time: planTo,
      enabled: isPlanEnabled,
      mode_at_end: 'pv',
      mode_at_start: 'now',
      from: planFrom,
      start: planFrom,
      start_date: startDate,
      start_time: planFrom,
      to: planTo,
    }

    callService({
      domain: 'script',
      service: 'turn_on',
      target: entityId,
      serviceData: {
        variables: {
          charge_plan: plan,
          plan: {
            ...plan,
            id: 'manual-charge-window',
          },
        },
      },
    })
    setPlanStatus(`Plan saved ${selectedPriceDay.label} ${planFrom} - ${planTo}`)
  }, [callService, canCallService, entityExists, isPlanEnabled, planFrom, planTo, selectedPriceDay.date, selectedPriceDay.label])

  const handleModeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as EvccChargeMode
      setSelectedMode(value)
      callSelectOption(ENERGY_ENTITIES.evccLoadpointMode, getEvccModeServiceOption(value, chargeModeOptions))
    },
    [callSelectOption, chargeModeOptions],
  )

  const handlePlanEnabledChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const enabled = event.target.checked
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

  const handlePlanFromChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPlanFrom(event.target.value)
    setPlanStatus('Unsaved changes')
  }, [])

  const handlePlanToChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPlanTo(event.target.value)
    setPlanStatus('Unsaved changes')
  }, [])

  const handleSavePlan = useCallback(() => {
    callInputBoolean(ENERGY_ENTITIES.evccChargePlanEnabled, isPlanEnabled)
    callChargePlanScript()
  }, [callChargePlanScript, callInputBoolean, isPlanEnabled])

  const handlePlanChartPointerLeave = useCallback(() => {
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

  const planWindowLabel = `${planFrom} - ${planTo}`

  const handleBackdropPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <div className="ev-modal-overlay" onPointerDown={handleBackdropPointerDown}>
      <section className="ev-modal" role="dialog" aria-modal="true" aria-labelledby="ev-modal-title">
        <header className="ev-modal__header">
          <h2 id="ev-modal-title">EV Charger</h2>
          <button className="ev-modal__close" type="button" aria-label="Close EV charger details" onClick={onClose}>
            <ModalIcon name="close" />
          </button>
        </header>

        <div className="ev-modal__overview">
          <div className="ev-modal__image-panel">
            <img src={assetPath('/new-energy-dashboard/charger.png')} alt="Wall mounted EV charger" />
          </div>

          <div className="ev-modal__status-panel">
            <div className="ev-status-card">
              <span className="ev-status-dot" />
              <div>
                <p>Status</p>
                <strong>{status}</strong>
                <small>{status === DASH ? 'Waiting for status' : 'Ready to charge'}</small>
              </div>
            </div>

            <div className="ev-stat-list">
              <EvModalStat icon="bolt" label="Power" unit="kW" value={chargeRate} />
              <EvModalStat icon="history" label="Session energy" unit="kWh" value={sessionEnergy} />
              <EvModalStat icon="clock" label="Duration" value={sessionDuration} />
            </div>
          </div>
        </div>

        <section className="ev-settings" aria-label="Charger settings">
          <h3>Charger settings</h3>
          <div className="ev-settings__list">
            <SettingRow description="EVCC loadpoint mode" label="Charge mode">
              <select aria-label="Charge mode" value={selectedMode} onChange={handleModeChange}>
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SettingRow>

            <SettingRow description={`Current window ${planWindowLabel}`} label="Charge plan">
              <label className="ev-switch">
                <input
                  aria-label="Charge plan enabled"
                  checked={isPlanEnabled}
                  type="checkbox"
                  onChange={handlePlanEnabledChange}
                />
                <span aria-hidden="true" />
              </label>
            </SettingRow>
          </div>
        </section>

        <section className="ev-plan" aria-label="Charge activity">
          <div className="ev-plan__header">
            <div>
              <h3>{bottomMode === 'plan' ? 'Plan charge' : 'Charge history'}</h3>
              <p>
                {bottomMode === 'plan'
                  ? 'Set the charging window and compare it against the energy prices.'
                  : 'Latest charge sessions reconstructed from Home Assistant history.'}
              </p>
            </div>
            <div className="ev-plan__tabs" role="tablist" aria-label="EV charger activity mode">
              <button
                aria-selected={bottomMode === 'plan'}
                className="ev-plan__tab"
                data-active={bottomMode === 'plan'}
                role="tab"
                type="button"
                onClick={() => setBottomMode('plan')}
              >
                Plan
              </button>
              <button
                aria-selected={bottomMode === 'history'}
                className="ev-plan__tab"
                data-active={bottomMode === 'history'}
                role="tab"
                type="button"
                onClick={() => setBottomMode('history')}
              >
                History
              </button>
            </div>
          </div>

          {bottomMode === 'plan' ? (
            <>
              <div className="ev-plan__meta">
                <span>{planStatus}</span>
              </div>

              <div className="ev-plan__controls">
                <label>
                  <span>From</span>
                  <input
                    aria-label="Plan charge from"
                    inputMode="numeric"
                    pattern="[0-9]{2}:[0-9]{2}"
                    type="text"
                    value={planFrom}
                    onChange={handlePlanFromChange}
                  />
                </label>
                <label>
                  <span>To</span>
                  <input
                    aria-label="Plan charge to"
                    inputMode="numeric"
                    pattern="[0-9]{2}:[0-9]{2}"
                    type="text"
                    value={planTo}
                    onChange={handlePlanToChange}
                  />
                </label>
                <button className="ev-plan__save" type="button" onClick={handleSavePlan}>
                  Save plan
                </button>
              </div>

              <div className="ev-plan__summary">
                <span>Now {priceCurrent} DKK/kWh</span>
                <span>Average {selectedDayAverage} DKK/kWh</span>
                <span>Peak {selectedDayPeak} DKK/kWh</span>
              </div>

              <div className="ev-plan__day-switcher">
                <button
                  aria-label="Select previous price day"
                  disabled={safePriceDayIndex === 0}
                  type="button"
                  onClick={handlePreviousPriceDay}
                >
                  ‹
                </button>
                <span aria-label="Energy price day">
                  <strong>{selectedPriceDay.label}</strong>
                  <small>{selectedPriceDay.date}</small>
                </span>
                <button
                  aria-label="Select next price day"
                  disabled={safePriceDayIndex >= priceDays.length - 1}
                  type="button"
                  onClick={handleNextPriceDay}
                >
                  ›
                </button>
              </div>

            <PricePlanChart
              from={planFrom}
              prices={
                selectedPriceDay.prices.length
                  ? selectedPriceDay.prices
                  : numbersToPriceHours(priceSeries, todayDateKey)
              }
              to={planTo}
              onHourClick={handlePriceHourClick}
              onHourPointerDown={handlePriceHourPointerDown}
              onHourPointerEnter={handlePriceHourPointerEnter}
              onHourPointerLeave={handlePlanChartPointerLeave}
              onHourPointerUp={handlePriceHourPointerUp}
            />
            </>
          ) : (
            <ChargeHistoryList sessions={sessionHistory} />
          )}
        </section>
      </section>
    </div>
  )
}

function ChargeHistoryList({ sessions }: { sessions: ReturnType<typeof useEvccChargeSessions> }) {
  if (!sessions.length) {
    return (
      <div className="ev-history-empty">
        <strong>No completed sessions yet</strong>
        <p>Home Assistant needs recorder history for the EVCC charging entities before sessions can appear here.</p>
      </div>
    )
  }

  return (
    <div className="ev-history-list" role="list" aria-label="Latest charge sessions">
      {sessions.slice(0, 6).map((session) => (
        <article className="ev-history-item" key={session.id} role="listitem">
          <div className="ev-history-item__top">
            <strong>{session.vehicle}</strong>
            <span>{session.startLabel}</span>
          </div>
          <div className="ev-history-item__stats">
            <div>
              <span>Energy</span>
              <strong>{session.energyKwh} kWh</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{session.durationLabel}</strong>
            </div>
            <div>
              <span>Finished</span>
              <strong>{session.endLabel ?? 'In progress'}</strong>
            </div>
            <div>
              <span>Cost</span>
              <strong>{session.costDkk ? `${session.costDkk} DKK` : '---'}</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function EvModalStat({
  icon,
  label,
  unit,
  value,
}: {
  icon: 'bolt' | 'clock' | 'history'
  label: string
  unit?: string
  value: string
}) {
  return (
    <div className="ev-modal-stat">
      <ModalIcon name={icon} />
      <div>
        <p>{label}</p>
        <strong>
          {value}
          {unit ? <small> {unit}</small> : null}
        </strong>
      </div>
    </div>
  )
}

function SettingRow({
  children,
  description,
  label,
}: {
  children: ReactNode
  description: string
  label: string
}) {
  return (
    <div className="ev-setting-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      {children}
    </div>
  )
}

function PricePlanChart({
  from,
  onHourClick,
  onHourPointerDown,
  onHourPointerEnter,
  onHourPointerLeave,
  onHourPointerUp,
  prices,
  to,
}: {
  from: string
  onHourClick: (hour: number) => void
  onHourPointerDown: (hour: number) => void
  onHourPointerEnter: (hour: number) => void
  onHourPointerLeave: () => void
  onHourPointerUp: () => void
  prices: PeakRateHour[]
  to: string
}) {
  const priceByHour = new Map(prices.map((price) => [price.hour, price]))
  const values = Array.from({ length: 24 }, (_, index) => priceByHour.get(index) ?? null)
  const availablePrices = values.map((value) => value?.price ?? 0)
  const max = Math.max(...availablePrices, 0.01)
  const fromHour = getHour(from)
  const toHour = getHour(to)

  return (
    <div className="ev-price-chart" aria-label="Energy prices by hour" onPointerLeave={onHourPointerLeave}>
      {values.map((priceWindow, index) => {
        const selected = isHourInWindow(index, fromHour, toHour)
        const hourLabel = `${index.toString().padStart(2, '0')}:00`
        const price = priceWindow?.price ?? 0
        const priceLabel = priceWindow ? `${price.toFixed(2)} DKK/kWh` : 'No price data'
        return (
          <button
            aria-label={`Select ${hourLabel} energy price ${priceLabel}`}
            className="ev-price-bar"
            data-price-label={`${hourLabel} · ${priceLabel}`}
            data-selected={selected}
            disabled={!priceWindow}
            key={index}
            style={{ '--bar-height': `${Math.max(5, (price / max) * 100)}%` } as CSSProperties}
            title={`${hourLabel} ${priceLabel}`}
            type="button"
            onClick={() => onHourClick(index)}
            onPointerDown={() => onHourPointerDown(index)}
            onPointerEnter={() => onHourPointerEnter(index)}
            onPointerUp={onHourPointerUp}
          />
        )
      })}
    </div>
  )
}

function ModalIcon({ name }: { name: 'bolt' | 'clock' | 'close' | 'history' }) {
  return (
    <svg className="ev-modal-icon" viewBox="0 0 24 24" aria-hidden="true">
      {renderModalIcon(name)}
    </svg>
  )
}

function renderModalIcon(name: 'bolt' | 'clock' | 'close' | 'history') {
  switch (name) {
    case 'bolt':
      return <path d="M13 2 5 14h6l-1 8 8-13h-6l1-7Z" fill="currentColor" stroke="none" />
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l4 2" />
        </>
      )
    case 'close':
      return <path d="m6 6 12 12M18 6 6 18" />
    case 'history':
      return (
        <>
          <path d="M4 12a8 8 0 1 0 2.4-5.7" />
          <path d="M4 5v5h5M12 8v5l3 2" />
        </>
      )
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

function isHourInWindow(hour: number, from: number, to: number) {
  if (from === to) {
    return true
  }

  if (from < to) {
    return hour >= from && hour < to
  }

  return hour >= from || hour < to
}
