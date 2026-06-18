import type { CSSProperties } from 'react'
import { assetPath } from '../../../utils/assetPath'
import type { EnergyPriceInsight, InsightHeaderControls, SolarForecastInsight } from '../dashboardInsights'
import { BarChart, InsightToolbar, Panel, PanelHeader } from './DesktopShared'

export function EnergyDistributionPanel({
  battery,
  ev,
  grid,
  home,
  solar,
}: {
  battery: string
  ev: string
  grid: string
  home: string
  solar: string
}) {
  return (
    <Panel className="distribution-panel">
      <PanelHeader title="Energy distribution" />
      <div className="distribution-map">
        <div className="dist-node dist-source dist-solar">
          <span className="dist-dot" aria-hidden="true" />
          <div>
            <span>Solar</span>
            <strong>{solar} kWh</strong>
          </div>
        </div>
        <div className="dist-node dist-source dist-grid">
          <span className="dist-dot" aria-hidden="true" />
          <div>
            <span>Grid</span>
            <strong>{grid} kWh</strong>
          </div>
        </div>
        <div className="dist-node dist-home">
          <span className="dist-dot" aria-hidden="true" />
          <div>
            <span>Home</span>
            <strong>{home} kWh</strong>
          </div>
        </div>
        <div className="dist-node dist-target dist-battery">
          <span className="dist-dot" aria-hidden="true" />
          <div>
            <span>Battery</span>
            <strong>{battery} kWh</strong>
          </div>
        </div>
        <div className="dist-node dist-target dist-ev">
          <span className="dist-dot" aria-hidden="true" />
          <div>
            <span>EV</span>
            <strong>{ev} kWh</strong>
          </div>
        </div>
        <svg viewBox="0 0 420 150" aria-hidden="true">
          <path className="dist-line dist-line-solar" d="M118 44H184Q204 44 204 62" />
          <path className="dist-line dist-line-grid" d="M118 112H184Q204 112 204 88" />
          <path className="dist-line dist-line-battery" d="M252 62Q252 44 276 44H348" />
          <path className="dist-line dist-line-ev" d="M252 88Q252 112 276 112H348" />
        </svg>
      </div>
    </Panel>
  )
}

export function SolarProductionPanel({ curve, value }: { curve: number[]; value: string }) {
  return (
    <Panel className="solar-production-panel">
      <PanelHeader title="Solar production" />
      <div className="panel-metric">
        <strong>{value}</strong>
        <span>kWh</span>
      </div>
      <p>Total production</p>
      <span className="delta-positive">^ 12%</span>
      <small className="delta-caption">vs yesterday</small>
      <BarChart className="production-bars" label="Solar production by hour" unit="kW" values={curve} />
    </Panel>
  )
}

export function BatteryStatusPanel({
  energy,
  power,
  soc,
  socValue,
  status,
}: {
  energy: string
  power: string
  soc: string
  socValue: number
  status: string
}) {
  const timeEstimate = getBatteryTimeEstimate({
    capacity: energy,
    power,
    socValue,
    status,
  })

  return (
    <Panel className="battery-status-panel">
      <h2>Battery status</h2>
      <div className="battery-status-grid">
        <div>
          <strong className="battery-soc">{soc}</strong>
          <span>State of charge</span>
          <strong>{energy} kWh</strong>
          <span>Stored energy</span>
        </div>
        <div className="large-battery" style={{ '--battery-level': `${socValue}%` } as CSSProperties}>
          <i />
        </div>
        <div className="battery-power-column" data-status={status.toLowerCase()}>
          <span>{status}</span>
          <strong>{power} kW</strong>
          <span>{timeEstimate.label}</span>
          <strong>{timeEstimate.value}</strong>
        </div>
      </div>
    </Panel>
  )
}

export function VehiclePanel({ battery, range }: { battery: string; range: string }) {
  return (
    <Panel className="vehicle-panel">
      <h2>Vehicle</h2>
      <img src={assetPath('/new-energy-dashboard/car.png')} alt="Electric vehicle" />
      <div className="vehicle-stats">
        <span>Status</span>
        <span>Battery</span>
        <span>Range</span>
        <strong>Parked</strong>
        <strong>{battery}</strong>
        <strong>{range}</strong>
      </div>
    </Panel>
  )
}

export function SolarForecastCard({
  controls,
  insight,
}: {
  controls: InsightHeaderControls
  insight: SolarForecastInsight
}) {
  return (
    <Panel className="wide-card insight-card solar-forecast-card">
      <PanelHeader showPeriod={false} title="Solar forecast" />
      <InsightToolbar controls={controls} windowLabel={insight.windowLabel} />
      <div className="insight-top-row">
        <div className="insight-hero">
          <div className="panel-metric compact">
            <strong>{insight.totalKwh}</strong>
            <span>kWh</span>
          </div>
          <p className="insight-primary-label">{insight.primaryLabel}</p>
        </div>
        {insight.summaryItems.length > 0 ? (
          <div className="insight-summary-grid">
            {insight.summaryItems.map((item) => (
              <div className="insight-summary-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="insight-chart-shell">
        <BarChart
          className="insight-bar-chart insight-bar-chart--solar"
          label="Solar forecast by hour"
          labels={insight.pointLabels}
          unit="kWh"
          values={insight.points}
        />
      </div>
    </Panel>
  )
}

export function EnergyPricesCard({
  controls,
  insight,
}: {
  controls: InsightHeaderControls
  insight: EnergyPriceInsight
}) {
  return (
    <Panel className="wide-card insight-card prices-card">
      <PanelHeader showPeriod={false} title="Energy prices" />
      <InsightToolbar controls={controls} windowLabel={insight.windowLabel} />
      <div className="insight-top-row">
        <div className="insight-hero">
          <div className="panel-metric compact">
            <strong>{insight.primaryValue}</strong>
            <span>DKK/kWh</span>
          </div>
          <p className="insight-primary-label">{insight.primaryLabel}</p>
        </div>
        <div className="insight-summary-grid">
          {insight.summaryItems.map((item) => (
            <div className="insight-summary-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="insight-chart-shell">
        <BarChart
          className="insight-bar-chart insight-bar-chart--prices"
          label="Energy prices by hour"
          labels={insight.pointLabels}
          unit="DKK/kWh"
          values={insight.points}
        />
      </div>
    </Panel>
  )
}

export function EvChargerOverviewCard({
  battery,
  chargeRate,
  onOpen,
  range,
  status,
}: {
  battery: string
  chargeRate: string
  onOpen: () => void
  range: string
  status: string
}) {
  return (
    <button
      aria-label="Open EV charger details"
      className="overview-panel wide-card ev-overview-card"
      type="button"
      onClick={onOpen}
    >
      <PanelHeader showPeriod={false} title="EV Charger" />
      <span className="ev-card-status">{status}</span>
      <img src={assetPath('/new-energy-dashboard/charger.png')} alt="Wall mounted EV charger" />
      <div className="ev-card-stats">
        <span>Vehicle</span>
        <strong>Tesla Model Y</strong>
        <span>Battery</span>
        <strong>{battery}</strong>
        <span>Range</span>
        <strong>{range} km</strong>
        <span>Power</span>
        <strong>{chargeRate} kW</strong>
      </div>
    </button>
  )
}

function getBatteryTimeEstimate({
  capacity,
  power,
  socValue,
  status,
}: {
  capacity: string
  power: string
  socValue: number
  status: string
}) {
  const normalizedStatus = status.toLowerCase()
  const capacityKwh = parseDisplayNumber(capacity)
  const powerKw = parseDisplayNumber(power)

  if (normalizedStatus === 'charging') {
    return {
      label: 'Time to full',
      value:
        capacityKwh === null || powerKw === null || powerKw <= 0.05
          ? '---'
          : formatDurationHours((capacityKwh * (100 - socValue)) / 100 / powerKw),
    }
  }

  if (normalizedStatus === 'discharging') {
    return {
      label: 'Time to empty',
      value:
        capacityKwh === null || powerKw === null || powerKw <= 0.05
          ? '---'
          : formatDurationHours((capacityKwh * socValue) / 100 / powerKw),
    }
  }

  return {
    label: 'Time estimate',
    value: '---',
  }
}

function parseDisplayNumber(value: string) {
  if (value === '---') {
    return null
  }

  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatDurationHours(hours: number) {
  if (!Number.isFinite(hours) || hours < 0) {
    return '---'
  }

  const totalMinutes = Math.round(hours * 60)

  if (totalMinutes < 1) {
    return '<1m'
  }

  const days = Math.floor(totalMinutes / 1440)
  const remainingMinutes = totalMinutes - days * 1440
  const wholeHours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60

  if (days > 0) {
    return `${days}d ${wholeHours}h`
  }

  if (wholeHours > 0) {
    return `${wholeHours}h ${minutes}m`
  }

  return `${minutes}m`
}
