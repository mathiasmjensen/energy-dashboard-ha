import type { CSSProperties, PointerEvent } from 'react'
import type { BatteryOptimizerState } from '../hooks/useBatteryOptimizer'
import { useCallback, useEffect, useState } from 'react'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../services/batteryMetrics'
import {
  BatteryOptimizerCharts,
  BatteryOptimizerControlsCard,
  BatteryOptimizerDecisionSummary,
  BatteryOptimizerPlanTable,
  BatteryOptimizerStatusCard,
  OptimizerStateBanner,
} from './battery/BatteryOptimizerSections'
import { LineChart } from './dashboard/desktop/DesktopShared'
import { EvUiIcon } from './ev/EvChargerContent'

const PERIODS = ['24h', '7d', '30d', '90d'] as const
type BatteryHistoryPeriod = (typeof PERIODS)[number]

type BatteryStatusModalProps = {
  capacity: string
  energy: string
  history: {
    day: { labels: string[]; points: number[] }
    month: { labels: string[]; points: number[] }
    quarter: { labels: string[]; points: number[] }
    week: { labels: string[]; points: number[] }
  }
  onClose: () => void
  optimizer: BatteryOptimizerState
  power: string
  soc: string
  socValue: number
  status: string
}

export function BatteryStatusModal({
  capacity,
  energy,
  history,
  onClose,
  optimizer,
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
  const activeHistory = period === '24h' ? history.day : period === '7d' ? history.week : period === '30d' ? history.month : history.quarter

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
            labels={activeHistory.labels}
            points={activeHistory.points}
            unit="%"
          />

          <div className="battery-modal__chart-note">
            <span className="battery-modal__info">i</span>
            <p>The graph shows the battery state of charge over the selected time period.</p>
          </div>
        </div>

        <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
        <div className="battery-modal__optimizer-grid">
          <BatteryOptimizerStatusCard optimizer={optimizer} variant="desktop" />
          <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="desktop" />
          <BatteryOptimizerControlsCard optimizer={optimizer} variant="desktop" />
        </div>
        <BatteryOptimizerPlanTable optimizer={optimizer} planHours={48} variant="desktop" />
        <BatteryOptimizerCharts optimizer={optimizer} variant="desktop" />
      </section>
    </div>
  )
}
