import type { CSSProperties, ReactNode } from 'react'
import type { EvChargerBottomMode, EvChargerController, EvPlanPriceHour } from '../../models/evChargePlan'
import { cn } from '../../lib/cn'
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
  const isMobile = layout === 'mobile'

  return (
    <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-[265px_minmax(0,1fr)]')}>
      <div
        className={cn(
          'grid place-items-center rounded-[22px] border border-white/10 bg-[#0c121d]/88 shadow-[0_24px_70px_rgba(0,0,0,0.24)]',
          isMobile ? 'min-h-[220px]' : 'h-[245px] w-[265px]',
        )}
      >
        <img src={assetPath('/new-energy-dashboard/charger.png')} alt="Wall mounted EV charger" />
      </div>

      <div className="grid gap-3 rounded-[22px] border border-white/10 bg-[#0c121d]/88 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex min-h-[88px] items-center gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
          <span className="h-3 w-3 rounded-full bg-dashboard-green shadow-[0_0_16px_rgba(96,234,93,0.56)]" />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-dashboard-muted">Status</p>
            <strong className="mt-1 block text-[1.35rem] font-semibold text-dashboard-text">{status}</strong>
            <small className="mt-1 block text-sm text-dashboard-soft">{status === DASH ? 'Waiting for status' : 'Ready to charge'}</small>
          </div>
        </div>

        <div className="grid gap-1 px-1 pb-1">
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
    <section className="grid gap-3" aria-label="Charger settings">
      <h3 className="text-lg font-semibold text-dashboard-text">Charger settings</h3>
      <div className="grid overflow-hidden rounded-[22px] border border-white/10 bg-[#0c121d]/88 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <SettingRow description="EVCC loadpoint mode" label="Charge mode">
          <select
            className="min-w-[140px] rounded-xl border border-white/10 bg-[#09101a] px-3 py-2 text-sm text-dashboard-text outline-none transition focus:border-dashboard-blue/50"
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
          <Toggle checked={controller.isPlanEnabled} label="Charge plan enabled">
            <input
              aria-label="Charge plan enabled"
              checked={controller.isPlanEnabled}
              type="checkbox"
              onChange={(event) => controller.handlePlanEnabledChange(event.target.checked)}
            />
          </Toggle>
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
    <section
      className={cn(
        'grid gap-4 rounded-[22px] border border-white/10 bg-[#0c121d]/88 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)]',
        layout === 'mobile' ? 'p-4' : 'p-5',
      )}
      aria-label="Charge activity"
    >
      <div className={cn('flex gap-4', layout === 'mobile' ? 'flex-col' : 'justify-between')}>
        <div>
          <h3 className="text-lg font-semibold text-dashboard-text">{isPlan ? 'Plan charge' : 'Charge history'}</h3>
          <p className="mt-1 text-sm leading-5 text-dashboard-soft">
            {isPlan
              ? 'Set the charging window and compare it against the energy prices.'
              : 'Latest charge sessions reconstructed from Home Assistant history.'}
          </p>
        </div>
        {showTabs ? <SegmentedControl mode={controller.bottomMode} onChange={controller.setBottomMode} /> : null}
      </div>

      {isPlan ? (
        <>
          <div className="flex justify-end">
            <span className="text-sm font-semibold text-dashboard-green">{controller.planStatus}</span>
          </div>

          {layout === 'mobile' ? <ActivePlanSummary controller={controller} /> : null}

          <div className={cn('grid gap-3', layout === 'mobile' ? 'grid-cols-1' : 'grid-cols-[1fr_1fr_auto] items-end')}>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-dashboard-muted">From</span>
              <input
                className="h-11 rounded-2xl border border-white/10 bg-[#09101a] px-4 text-sm text-dashboard-text outline-none transition focus:border-dashboard-blue/50"
                aria-label="Plan charge from"
                inputMode="numeric"
                pattern="[0-9]{2}:[0-9]{2}"
                type="text"
                value={controller.planFrom}
                onChange={(event) => controller.handlePlanFromChange(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-dashboard-muted">To</span>
              <input
                className="h-11 rounded-2xl border border-white/10 bg-[#09101a] px-4 text-sm text-dashboard-text outline-none transition focus:border-dashboard-blue/50"
                aria-label="Plan charge to"
                inputMode="numeric"
                pattern="[0-9]{2}:[0-9]{2}"
                type="text"
                value={controller.planTo}
                onChange={(event) => controller.handlePlanToChange(event.target.value)}
              />
            </label>
            <button className={saveButtonClassName(layout)} type="button" onClick={controller.handleSavePlan}>
              Save plan
            </button>
          </div>

          <div className={cn('grid gap-3', layout === 'mobile' ? 'grid-cols-1' : 'grid-cols-3')}>
            <span className={summaryStatClassName()}>
              <small className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Now</small>
              <strong className="mt-1 block text-sm font-semibold text-dashboard-text">{controller.priceSummary.current} DKK/kWh</strong>
            </span>
            <span className={summaryStatClassName()}>
              <small className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Average</small>
              <strong className="mt-1 block text-sm font-semibold text-dashboard-text">{controller.priceSummary.average} DKK/kWh</strong>
            </span>
            <span className={summaryStatClassName()}>
              <small className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Peak</small>
              <strong className="mt-1 block text-sm font-semibold text-dashboard-text">{controller.priceSummary.peak} DKK/kWh</strong>
            </span>
          </div>

          <div className="grid grid-cols-[42px_1fr_42px] items-center gap-2">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Select previous price day"
              disabled={controller.safePriceDayIndex === 0}
              type="button"
              onClick={controller.handlePreviousPriceDay}
            >
              ‹
            </button>
            <span aria-label="Energy price day" className="grid min-w-0 justify-items-center gap-0.5 text-center">
              <strong className="text-sm font-semibold text-dashboard-text">{controller.selectedPriceDay.label}</strong>
              <small className="text-xs text-dashboard-soft">{controller.selectedPriceDay.date}</small>
            </span>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-dashboard-text transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
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
    <section className="grid gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-3" aria-label="Active charge plan">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Active plan</span>
          <strong className="mt-1 block text-xl font-semibold text-dashboard-text">{controller.planWindowLabel}</strong>
        </div>
        <Toggle checked={controller.isPlanEnabled} label="Active charge plan enabled">
          <input
            aria-label="Active charge plan enabled"
            checked={controller.isPlanEnabled}
              type="checkbox"
            onChange={(event) => controller.handlePlanEnabledChange(event.target.checked)}
          />
        </Toggle>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/8 bg-[#09101a]/80 px-3 py-2.5">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Status</span>
          <strong className="mt-1 block truncate text-sm font-semibold text-dashboard-text">{controller.isPlanEnabled ? 'Enabled' : 'Paused'}</strong>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#09101a]/80 px-3 py-2.5">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Price day</span>
          <strong className="mt-1 block truncate text-sm font-semibold text-dashboard-text">{controller.selectedPriceDay.label}</strong>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#09101a]/80 px-3 py-2.5">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Charge mode</span>
          <strong className="mt-1 block truncate text-sm font-semibold text-dashboard-text">{modeLabel}</strong>
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
    <div className="inline-grid grid-flow-col gap-1 rounded-2xl border border-white/10 bg-[#09101a]/84 p-1" role="tablist" aria-label="EV charger activity mode">
      <button
        aria-selected={mode === 'plan'}
        className={cn(
          'min-h-9 min-w-[84px] rounded-xl px-3 text-sm font-semibold transition',
          mode === 'plan'
            ? 'bg-dashboard-blue/18 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.16)]'
            : 'text-dashboard-soft hover:bg-white/6 hover:text-dashboard-text',
        )}
        role="tab"
        type="button"
        onClick={() => onChange('plan')}
      >
        Plan
      </button>
      <button
        aria-selected={mode === 'history'}
        className={cn(
          'min-h-9 min-w-[84px] rounded-xl px-3 text-sm font-semibold transition',
          mode === 'history'
            ? 'bg-dashboard-blue/18 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.16)]'
            : 'text-dashboard-soft hover:bg-white/6 hover:text-dashboard-text',
        )}
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
      <div className="grid min-h-[182px] place-content-center gap-2 rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-6 text-center">
        <strong className="text-base font-semibold text-dashboard-text">No completed sessions yet</strong>
        <p className="max-w-[28rem] text-sm leading-5 text-dashboard-soft">Home Assistant needs recorder history for the EVCC charging entities before sessions can appear here.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3" role="list" aria-label="Latest charge sessions">
      {sessions.slice(0, 12).map((session) => (
        <article className="grid gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.18)]" key={session.id} role="listitem">
          <div className="flex items-baseline justify-between gap-3">
            <strong className="text-sm font-semibold text-dashboard-text">{session.vehicle}</strong>
            <span className="text-xs text-dashboard-soft">{session.startLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Energy</span>
              <strong className="text-sm font-semibold text-dashboard-text">{session.energyKwh} kWh</strong>
            </div>
            <div className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Duration</span>
              <strong className="text-sm font-semibold text-dashboard-text">{session.durationLabel}</strong>
            </div>
            <div className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Finished</span>
              <strong className="text-sm font-semibold text-dashboard-text">{session.endLabel ?? 'In progress'}</strong>
            </div>
            <div className="grid gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">Cost</span>
              <strong className="text-sm font-semibold text-dashboard-text">{session.costDkk ? `${session.costDkk} DKK` : '---'}</strong>
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
    <div className="flex min-h-[56px] items-center gap-4 border-t border-white/8 px-2 py-3 first:border-t-0">
      <EvUiIcon name={icon} />
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</p>
        <strong className="mt-1 block text-lg font-semibold text-dashboard-text">
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
    <div className="flex items-center justify-between gap-4 border-t border-white/8 px-4 py-3 first:border-t-0">
      <div>
        <strong className="block text-sm font-semibold text-dashboard-text">{label}</strong>
        <p className="mt-1 text-sm text-dashboard-soft">{description}</p>
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
    <div
      className="relative flex h-[132px] items-end gap-1.5 overflow-hidden rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(47,134,255,0.12),rgba(8,12,18,0.18))] px-2 py-3"
      aria-label="Energy prices by hour"
      onPointerLeave={onHourPointerLeave}
    >
      {values.map((priceWindow, index) => {
        const selected = priceWindow.startMs >= startMs && priceWindow.startMs < endMs
        const datePrefix = index === 0 || values[index - 1]?.date !== priceWindow.date ? `${priceWindow.date} ` : ''
        const hourLabel = `${datePrefix}${priceWindow.label}`
        const price = priceWindow.price
        const priceLabel = `${price.toFixed(2)} DKK/kWh`

        return (
          <button
            aria-label={`Select ${hourLabel} energy price ${priceLabel}`}
            className="group relative z-[1] h-full min-h-0 min-w-0 flex-1 self-end rounded-none border-0 bg-transparent p-0 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:-translate-y-0.5 focus-visible:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
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
            <span
              className={cn(
                'absolute bottom-0 left-[8%] right-[8%] min-h-[4px] rounded-[10px] shadow-[0_0_18px_rgba(59,130,255,0.44)]',
                selected
                  ? 'bg-[linear-gradient(180deg,#73f28b,#29c75c)] shadow-[0_0_18px_rgba(51,214,107,0.48)]'
                  : 'bg-[linear-gradient(180deg,#70a7ff,#1f73ff)]',
              )}
              style={{ height: 'var(--bar-height)' }}
            />
            <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-lg border border-white/12 bg-[#070d16]/95 px-2 py-1 text-[11px] text-white opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {`${hourLabel} · ${priceLabel}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function EvUiIcon({ name }: { name: 'bolt' | 'clock' | 'close' | 'history' }) {
  return (
    <svg className="h-[23px] w-[23px] flex-none stroke-current" viewBox="0 0 24 24" aria-hidden="true">
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

function Toggle({
  checked,
  children,
  label,
}: {
  checked: boolean
  children: ReactNode
  label: string
}) {
  return (
    <label className="relative inline-flex h-7 w-12 cursor-pointer" aria-label={label}>
      <span className="absolute inset-0 opacity-0">{children}</span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 rounded-full border border-white/12 transition',
          checked
            ? 'bg-[linear-gradient(180deg,#4e93ff,#2f6fff)] shadow-[0_0_18px_rgba(47,134,255,0.36)]'
            : 'bg-white/10',
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-[#f7f9fc] shadow-[0_3px_9px_rgba(0,0,0,0.36)] transition',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </label>
  )
}

function saveButtonClassName(layout: 'mobile' | 'modal') {
  return cn(
    'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[rgba(150,255,177,0.64)] font-extrabold tracking-[0.01em] text-[#06130b] shadow-[0_16px_32px_rgba(80,222,100,0.2)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50',
    'bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.56),transparent_34%),linear-gradient(135deg,#8cffaa_0%,#32de6b_48%,#15b14f_100%)]',
    layout === 'mobile' ? 'h-11 w-full px-4' : 'h-[42px] px-5',
  )
}

function summaryStatClassName() {
  return 'grid gap-1 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5'
}
