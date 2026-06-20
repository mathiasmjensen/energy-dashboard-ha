import type { CSSProperties, PointerEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getBatteryHistorySeries, type BatteryHistoryPeriod } from '../services/batteryHistory'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../services/batteryMetrics'
import { LineChart } from './dashboard/desktop/DesktopShared'
import { EvUiIcon } from './ev/EvChargerContent'

const PERIODS: BatteryHistoryPeriod[] = ['24h', '7d', '30d', '90d']

type BatteryStatusModalProps = {
  capacity: string
  energy: string
  onClose: () => void
  power: string
  soc: string
  socValue: number
  status: string
}

export function BatteryStatusModal({
  capacity,
  energy,
  onClose,
  power,
  soc,
  socValue,
  status,
}: BatteryStatusModalProps) {
  const [period, setPeriod] = useState<BatteryHistoryPeriod>('24h')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const timeEstimate = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(capacity),
    powerKw: parseDisplayNumber(power),
    socPercent: socValue,
    status,
    storedEnergyKwh: parseDisplayNumber(energy),
  })
  const history = useMemo(() => getBatteryHistorySeries(socValue, period), [period, socValue])

  return (
    <div className="battery-modal-overlay" onPointerDown={handleBackdropPointerDown}>
      <section className="battery-modal" role="dialog" aria-modal="true" aria-labelledby="battery-modal-title">
        <header className="battery-modal__header">
          <h2 id="battery-modal-title">Battery status</h2>
          <button className="battery-modal__close" type="button" aria-label="Close battery details" onClick={onClose}>
            <EvUiIcon name="close" />
          </button>
        </header>

        <div className="battery-modal__summary">
          <div className="battery-modal__metric-column">
            <strong className="battery-modal__soc">{soc}</strong>
            <span>State of charge</span>
            <hr />
            <strong>{energy} kWh</strong>
            <span>Stored energy</span>
          </div>

          <div className="battery-modal__visual">
            <div className="large-battery large-battery--modal" style={{ '--battery-level': `${socValue}%` } as CSSProperties}>
              <i />
            </div>
          </div>

          <div className="battery-modal__metric-column battery-modal__metric-column--status" data-status={status.toLowerCase()}>
            <strong className="battery-modal__status">{status}</strong>
            <strong>{power} kW</strong>
            <span>{timeEstimate.label}</span>
            <hr />
            <strong>{timeEstimate.value}</strong>
          </div>
        </div>

        <div className="battery-modal__chart-card">
          <div className="battery-modal__chart-header">
            <h3>Battery % over time</h3>
            <div className="battery-modal__periods" role="tablist" aria-label="Battery history period">
              {PERIODS.map((item) => (
                <button
                  key={item}
                  aria-selected={period === item}
                  className="battery-modal__period"
                  data-active={period === item}
                  role="tab"
                  type="button"
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <LineChart
            className="battery-modal__chart"
            color="#60ea5d"
            label="Battery percentage over time"
            labels={history.labels}
            points={history.points}
            unit="%"
          />

          <div className="battery-modal__chart-note">
            <span className="battery-modal__info">i</span>
            <p>The graph shows the battery state of charge over the selected time period.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
