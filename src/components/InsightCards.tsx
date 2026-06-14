import type { CSSProperties } from 'react'
import { EnergyIcon } from './EnergyIcon'
import { GlassPanel } from './GlassPanel'
import { assetPath } from '../utils/assetPath'

type InsightCardsProps = {
  energyIndependence: string
  evChargePower: string
  evChargeRateLimit: string
  evChargeSessionEnergy: string
  evChargeStatus: string
  gridExportedToday: string
  gridPower: string
  gridStatus: string
  onOpenEvCharger: () => void
  peakRateNext: string
  peakRateNextLabel: string
  peakRateNow: string
  selfPoweredPercent: string
  selfPoweredValue: number
  solarForecastBars: number[] | null
  solarForecastToday: string
}

const forecastBars = [3, 4, 7, 11, 17, 25, 36, 48, 61, 74, 88, 100, 94, 86, 76, 64, 52, 39, 27, 16, 8, 4]

export function InsightCards({
  energyIndependence,
  evChargePower,
  evChargeRateLimit,
  evChargeSessionEnergy,
  evChargeStatus,
  gridExportedToday,
  gridPower,
  gridStatus,
  onOpenEvCharger,
  peakRateNext,
  peakRateNextLabel,
  peakRateNow,
  selfPoweredPercent,
  selfPoweredValue,
  solarForecastBars,
  solarForecastToday,
}: InsightCardsProps) {
  return (
    <div className="bottom-row">
      <SolarForecast bars={solarForecastBars} value={solarForecastToday} />
      <SelfPowered value={selfPoweredPercent} progress={selfPoweredValue} energy={energyIndependence} />
      <PeakRate now={peakRateNow} next={peakRateNext} nextLabel={peakRateNextLabel} />
      <GridStatus power={gridPower} status={gridStatus} exported={gridExportedToday} />
      <EvChargerRates
        chargeRate={evChargePower}
        maxRate={evChargeRateLimit}
        onOpen={onOpenEvCharger}
        sessionEnergy={evChargeSessionEnergy}
        status={evChargeStatus}
      />
    </div>
  )
}

function SolarForecast({ bars, value }: { bars: number[] | null; value: string }) {
  const chartBars = bars?.length ? bars : forecastBars

  return (
    <GlassPanel accent="cyan" className="insight-card forecast-card">
      <header>
        <EnergyIcon name="solar" />
        <h2>Solar Forecast</h2>
      </header>
      <div className="insight-value">
        <span>{value}</span>
        <small>kWh</small>
      </div>
      <p>Daily Estimate</p>
      <div className="bar-chart" aria-hidden="true">
        {chartBars.map((height, index) => (
          <i key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="chart-axis">
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
      </div>
    </GlassPanel>
  )
}

function SelfPowered({
  energy,
  progress,
  value,
}: {
  energy: string
  progress: number
  value: string
}) {
  return (
    <GlassPanel accent="green" className="insight-card self-card">
      <header>
        <EnergyIcon name="selfPowered" />
        <h2>Self Powered</h2>
      </header>
      <div className="self-card__body">
        <div className="progress-ring" style={{ '--ring-value': progress } as CSSProperties}>
          <span />
        </div>
        <div>
          <div className="insight-value">
            <span>{value}</span>
            <small>%</small>
          </div>
          <p>Self Powered Today</p>
          <p className="energy-line">{energy} kWh / --- kWh</p>
          <p>Energy Independence</p>
        </div>
      </div>
    </GlassPanel>
  )
}

function PeakRate({ next, nextLabel, now }: { next: string; nextLabel: string; now: string }) {
  return (
    <GlassPanel accent="yellow" className="insight-card rate-card">
      <header>
        <EnergyIcon name="rate" />
        <h2>Peak Rate</h2>
      </header>
      <RateRow icon="rate" label="Now" value={now} />
      <div className="divider" />
      <RateRow icon="bolt" label={nextLabel} value={next} />
    </GlassPanel>
  )
}

function RateRow({
  icon,
  label,
  value,
}: {
  icon: 'rate' | 'bolt'
  label: string
  value: string
}) {
  return (
    <div className="rate-row">
      <div className="rate-row__icon">
        <EnergyIcon name={icon} />
      </div>
      <div>
        <div className="rate-row__value">
          <small>$</small>
          <span>{value}</span>
          <small>/kWh</small>
        </div>
        <p>{label}</p>
      </div>
    </div>
  )
}

function GridStatus({
  exported,
  power,
  status,
}: {
  exported: string
  power: string
  status: string
}) {
  return (
    <GlassPanel accent="yellow" className="insight-card grid-status-card">
      <header>
        <EnergyIcon name="status" />
        <h2>Grid Status</h2>
      </header>
      <p className="status-text">{status}</p>
      <div className="grid-power">
        <span>{power}</span>
        <small>kW</small>
      </div>
      <div className="divider" />
      <p>Today Exported</p>
      <div className="grid-export">
        <span>{exported}</span>
        <small>kWh</small>
      </div>
    </GlassPanel>
  )
}

function EvChargerRates({
  chargeRate,
  maxRate,
  onOpen,
  sessionEnergy,
  status,
}: {
  chargeRate: string
  maxRate: string
  onOpen: () => void
  sessionEnergy: string
  status: string
}) {
  return (
    <button
      className="glass-panel insight-card charger-card"
      data-accent="green"
      type="button"
      aria-label="Open EV charger details"
      onClick={onOpen}
    >
      <header>
        <EnergyIcon name="ev" />
        <h2>EV Charger</h2>
      </header>
      <img
        className="charger-card__image"
        src={assetPath('/energy-dashboard/charger.png')}
        alt="Wall mounted EV charger"
      />
      <div className="charger-card__status">{status}</div>
      <div className="charger-card__primary">
        <span>{chargeRate}</span>
        <small>kW</small>
        <p>Current Rate</p>
      </div>
      <dl className="charger-card__stats">
        <div>
          <dt>Max Current</dt>
          <dd>
            <span>{maxRate}</span>
            <small>A</small>
          </dd>
        </div>
        <div>
          <dt>Session</dt>
          <dd>
            <span>{sessionEnergy}</span>
            <small>kWh</small>
          </dd>
        </div>
      </dl>
    </button>
  )
}
