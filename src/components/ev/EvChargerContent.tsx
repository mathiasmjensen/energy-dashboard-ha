import type { CSSProperties, ReactNode } from 'react'
import type { EvChargerBottomMode, EvChargerController, EvPlanPriceHour } from '../../hooks/useEvChargerController'
import { assetPath } from '../../utils/assetPath'

const DASH = '---'

export type EvChargerContentProps = {
  chargeRate: string
  controller: EvChargerController
  layout?: 'mobile' | 'modal'
  sessionDuration: string
  sessionEnergy: string
  status: string
}

export function EvChargerOverviewSection({
  chargeRate,
  layout = 'modal',
  sessionDuration,
  sessionEnergy,
  status,
}: Omit<EvChargerContentProps, 'controller'>) {
  return (
    <div className={`ev-summary-grid ev-summary-grid--${layout}`}>
      <div className="ev-summary-image">
        <img src={assetPath('/new-energy-dashboard/charger.png')} alt="Wall mounted EV charger" />
      </div>

      <div className="ev-summary-stats">
        <div className="ev-status-card">
          <span className="ev-status-dot" />
          <div>
            <p>Status</p>
            <strong>{status}</strong>
            <small>{status === DASH ? 'Waiting for status' : 'Ready to charge'}</small>
          </div>
        </div>

        <div className="ev-stat-list">
          <EvStat icon="bolt" label="Power" unit="kW" value={chargeRate} />
          <EvStat icon="history" label="Session energy" unit="kWh" value={sessionEnergy} />
          <EvStat icon="clock" label="Duration" value={sessionDuration} />
        </div>
      </div>
    </div>
  )
}

export function EvChargerSettingsSection({ controller }: { controller: EvChargerController }) {
  return (
    <section className="ev-settings" aria-label="Charger settings">
      <h3>Charger settings</h3>
      <div className="ev-settings__list">
        <SettingRow description="EVCC loadpoint mode" label="Charge mode">
          <select
            aria-label="Charge mode"
            value={controller.selectedMode}
            onChange={(event) => controller.handleModeChange(event.target.value as typeof controller.selectedMode)}
          >
            {controller.modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingRow>

        <SettingRow description={`Current window ${controller.planWindowLabel}`} label="Charge plan">
          <label className="ev-switch">
            <input
              aria-label="Charge plan enabled"
              checked={controller.isPlanEnabled}
              type="checkbox"
              onChange={(event) => controller.handlePlanEnabledChange(event.target.checked)}
            />
            <span aria-hidden="true" />
          </label>
        </SettingRow>
      </div>
    </section>
  )
}

export function EvChargerActivitySection({
  controller,
  layout = 'modal',
  showTabs = true,
}: {
  controller: EvChargerController
  layout?: 'mobile' | 'modal'
  showTabs?: boolean
}) {
  const isPlan = controller.bottomMode === 'plan'

  return (
    <section className={`ev-plan ev-plan--${layout}`} aria-label="Charge activity">
      <div className="ev-plan__header">
        <div>
          <h3>{isPlan ? 'Plan charge' : 'Charge history'}</h3>
          <p>
            {isPlan
              ? 'Set the charging window and compare it against the energy prices.'
              : 'Latest charge sessions reconstructed from Home Assistant history.'}
          </p>
        </div>
        {showTabs ? <SegmentedControl mode={controller.bottomMode} onChange={controller.setBottomMode} /> : null}
      </div>

      {isPlan ? (
        <>
          <div className="ev-plan__meta">
            <span>{controller.planStatus}</span>
          </div>

          {layout === 'mobile' ? <ActivePlanSummary controller={controller} /> : null}

          <div className="ev-plan__controls">
            <label>
              <span>From</span>
              <input
                aria-label="Plan charge from"
                inputMode="numeric"
                pattern="[0-9]{2}:[0-9]{2}"
                type="text"
                value={controller.planFrom}
                onChange={(event) => controller.handlePlanFromChange(event.target.value)}
              />
            </label>
            <label>
              <span>To</span>
              <input
                aria-label="Plan charge to"
                inputMode="numeric"
                pattern="[0-9]{2}:[0-9]{2}"
                type="text"
                value={controller.planTo}
                onChange={(event) => controller.handlePlanToChange(event.target.value)}
              />
            </label>
            <button className="ev-plan__save" type="button" onClick={controller.handleSavePlan}>
              Save plan
            </button>
          </div>

          <div className="ev-plan__summary">
            <span>
              <small>Now</small>
              <strong>{controller.priceSummary.current} DKK/kWh</strong>
            </span>
            <span>
              <small>Average</small>
              <strong>{controller.priceSummary.average} DKK/kWh</strong>
            </span>
            <span>
              <small>Peak</small>
              <strong>{controller.priceSummary.peak} DKK/kWh</strong>
            </span>
          </div>

          <div className="ev-plan__day-switcher">
            <button
              aria-label="Select previous price day"
              disabled={controller.safePriceDayIndex === 0}
              type="button"
              onClick={controller.handlePreviousPriceDay}
            >
              ‹
            </button>
            <span aria-label="Energy price day">
              <strong>{controller.selectedPriceDay.label}</strong>
              <small>{controller.selectedPriceDay.date}</small>
            </span>
            <button
              aria-label="Select next price day"
              disabled={controller.safePriceDayIndex >= controller.priceDayCount - 1}
              type="button"
              onClick={controller.handleNextPriceDay}
            >
              ›
            </button>
          </div>

          <PricePlanChart
            endMs={controller.planEndMs}
            prices={controller.priceHours}
            startMs={controller.planStartMs}
            onHourClick={controller.handlePriceHourClick}
            onHourPointerDown={controller.handlePriceHourPointerDown}
            onHourPointerEnter={controller.handlePriceHourPointerEnter}
            onHourPointerLeave={controller.handlePriceHourPointerLeave}
            onHourPointerUp={controller.handlePriceHourPointerUp}
          />
        </>
      ) : (
        <ChargeHistoryList sessions={controller.sessionHistory} />
      )}
    </section>
  )
}

export function EvChargerContent({
  chargeRate,
  controller,
  layout = 'modal',
  sessionDuration,
  sessionEnergy,
  status,
}: EvChargerContentProps) {
  return (
    <>
      <EvChargerOverviewSection
        chargeRate={chargeRate}
        layout={layout}
        sessionDuration={sessionDuration}
        sessionEnergy={sessionEnergy}
        status={status}
      />
      <EvChargerSettingsSection controller={controller} />
      <EvChargerActivitySection controller={controller} layout={layout} />
    </>
  )
}

function ActivePlanSummary({ controller }: { controller: EvChargerController }) {
  const modeLabel =
    controller.modeOptions.find((option) => option.value === controller.selectedMode)?.label ?? controller.selectedMode

  return (
    <section className="ev-active-plan" aria-label="Active charge plan">
      <div className="ev-active-plan__header">
        <div>
          <span>Active plan</span>
          <strong>{controller.planWindowLabel}</strong>
        </div>
        <label className="ev-switch ev-switch--plan">
          <input
            aria-label="Active charge plan enabled"
            checked={controller.isPlanEnabled}
            type="checkbox"
            onChange={(event) => controller.handlePlanEnabledChange(event.target.checked)}
          />
          <span aria-hidden="true" />
        </label>
      </div>

      <div className="ev-active-plan__grid">
        <div>
          <span>Status</span>
          <strong>{controller.isPlanEnabled ? 'Enabled' : 'Paused'}</strong>
        </div>
        <div>
          <span>Price day</span>
          <strong>{controller.selectedPriceDay.label}</strong>
        </div>
        <div>
          <span>Charge mode</span>
          <strong>{modeLabel}</strong>
        </div>
      </div>
    </section>
  )
}

function SegmentedControl({
  mode,
  onChange,
}: {
  mode: EvChargerBottomMode
  onChange: (mode: EvChargerBottomMode) => void
}) {
  return (
    <div className="ev-plan__tabs" role="tablist" aria-label="EV charger activity mode">
      <button
        aria-selected={mode === 'plan'}
        className="ev-plan__tab"
        data-active={mode === 'plan'}
        role="tab"
        type="button"
        onClick={() => onChange('plan')}
      >
        Plan
      </button>
      <button
        aria-selected={mode === 'history'}
        className="ev-plan__tab"
        data-active={mode === 'history'}
        role="tab"
        type="button"
        onClick={() => onChange('history')}
      >
        History
      </button>
    </div>
  )
}

function ChargeHistoryList({ sessions }: { sessions: EvChargerController['sessionHistory'] }) {
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
      {sessions.slice(0, 12).map((session) => (
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

function EvStat({
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
      <EvUiIcon name={icon} />
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
  endMs,
  onHourClick,
  onHourPointerDown,
  onHourPointerEnter,
  onHourPointerLeave,
  onHourPointerUp,
  prices,
  startMs,
}: {
  endMs: number
  onHourClick: (window: EvPlanPriceHour) => void
  onHourPointerDown: (window: EvPlanPriceHour) => void
  onHourPointerEnter: (window: EvPlanPriceHour) => void
  onHourPointerLeave: () => void
  onHourPointerUp: () => void
  prices: EvPlanPriceHour[]
  startMs: number
}) {
  const values = prices.slice(0, 24)
  const availablePrices = values.map((value) => value.price)
  const max = Math.max(...availablePrices, 0.01)

  return (
    <div className="ev-price-chart" aria-label="Energy prices by hour" onPointerLeave={onHourPointerLeave}>
      {values.map((priceWindow, index) => {
        const selected = priceWindow.startMs >= startMs && priceWindow.startMs < endMs
        const datePrefix = index === 0 || values[index - 1]?.date !== priceWindow.date ? `${priceWindow.date} ` : ''
        const hourLabel = `${datePrefix}${priceWindow.label}`
        const price = priceWindow.price
        const priceLabel = `${price.toFixed(2)} DKK/kWh`

        return (
          <button
            aria-label={`Select ${hourLabel} energy price ${priceLabel}`}
            className="ev-price-bar"
            data-price-label={`${hourLabel} · ${priceLabel}`}
            data-selected={selected}
            disabled={priceWindow.disabled}
            key={index}
            style={{ '--bar-height': `${Math.max(5, (price / max) * 100)}%` } as CSSProperties}
            title={`${hourLabel} ${priceLabel}`}
            type="button"
            onClick={() => onHourClick(priceWindow)}
            onPointerDown={() => onHourPointerDown(priceWindow)}
            onPointerEnter={() => onHourPointerEnter(priceWindow)}
            onPointerUp={onHourPointerUp}
          >
            <span className="ev-price-bar__fill" />
          </button>
        )
      })}
    </div>
  )
}

export function EvUiIcon({ name }: { name: 'bolt' | 'clock' | 'close' | 'history' }) {
  return (
    <svg className="ev-modal-icon" viewBox="0 0 24 24" aria-hidden="true">
      {renderIcon(name)}
    </svg>
  )
}

function renderIcon(name: 'bolt' | 'clock' | 'close' | 'history') {
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
