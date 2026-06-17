import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { EvChargerModal } from './EvChargerModal'
import { MobileDashboard } from './mobile/MobileDashboard'
import { useEnergyData } from '../hooks/useEnergyData'
import { useEvChargerController } from '../hooks/useEvChargerController'
import { useIsMobileView } from '../hooks/useIsMobileView'
import { usePeakRates } from '../hooks/usePeakRates'
import type { PeakRateDay, PeakRateWindow } from '../hooks/usePeakRates'
import { useSceneScale } from '../hooks/useSceneScale'
import { useSolarForecast } from '../hooks/useSolarForecast'
import type { SolarForecastWindow } from '../hooks/useSolarForecast'
import { useTodayEnergyTotals } from '../hooks/useTodayEnergyTotals'
import { assetPath } from '../utils/assetPath'
import './EnergyDashboard.css'

const DESIGN_WIDTH = 1672
const DESIGN_HEIGHT = 941
const DAY_MS = 24 * 60 * 60 * 1000
const FALLBACK_SOLAR_CURVE = [0, 0, 0, 0, 0.2, 0.8, 1.6, 3, 4.8, 6.5, 7.6, 8, 7.8, 7, 6, 4.5, 2.8, 1.3, 0.4, 0, 0, 0, 0, 0]
const FALLBACK_PRICE_CURVE = [
  1.92, 1.84, 1.66, 1.47, 1.28, 1.13, 1.08, 1.16, 1.34, 1.58, 1.82, 2.24, 2.52, 2.68, 2.61, 2.42, 2.06,
  1.72, 1.52, 1.48, 1.42, 1.39, 1.44, 1.58,
]
const NAV_ITEMS: Array<{ active?: boolean; icon: IconName; label: string }> = [
  { active: true, icon: 'home', label: 'Overview' },
]
type InsightViewMode = 'timeline' | 'today'

type IconName =
  | 'battery'
  | 'bolt'
  | 'car'
  | 'clock'
  | 'grid'
  | 'history'
  | 'home'
  | 'settings'
  | 'solar'
  | 'sun'
  | 'zap'

export function EnergyDashboard() {
  const scale = useSceneScale()
  const isMobileView = useIsMobileView()
  const data = useEnergyData()
  const peakRates = usePeakRates()
  const solarForecast = useSolarForecast()
  const todayTotals = useTodayEnergyTotals()
  const [isEvChargerOpen, setIsEvChargerOpen] = useState(false)
  const [insightDayOffset, setInsightDayOffset] = useState(0)
  const [insightViewMode, setInsightViewMode] = useState<InsightViewMode>('today')
  const [now, setNow] = useState(() => new Date())
  const openEvCharger = useCallback(() => setIsEvChargerOpen(true), [])
  const closeEvCharger = useCallback(() => setIsEvChargerOpen(false), [])

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(clockId)
  }, [])

  const shellStyle = {
    width: `${DESIGN_WIDTH * scale}px`,
    height: `${DESIGN_HEIGHT * scale}px`,
  }
  const sceneStyle = {
    transform: `scale(${scale})`,
  } satisfies CSSProperties

  const solarForecastKwh = solarForecast.todayKwh ?? data.solarForecastToday
  const solarProductionEnergyKwh = data.solarProductionToday === '---' ? solarForecastKwh : data.solarProductionToday
  const solarPowerCurve = solarForecast.hourlyPowerKw.some((value) => value > 0)
    ? solarForecast.hourlyPowerKw
    : FALLBACK_SOLAR_CURVE
  const fallbackPriceDay = createFallbackPriceDay(now)
  const priceDays = peakRates.days.length ? peakRates.days : [fallbackPriceDay]
  const priceCurve = peakRates.hourlyPrices.length ? peakRates.hourlyPrices : FALLBACK_PRICE_CURVE
  const hasPeakRateWindows = peakRates.windows.length > 0
  const fallbackCurrentPrice = fallbackPriceDay.prices[now.getHours()]?.price.toFixed(2) ?? data.peakRateNow
  const averagePrice = peakRates.average ?? (hasPeakRateWindows ? '---' : fallbackPriceDay.average ?? data.peakRateNow)
  const currentPrice = peakRates.now ?? (hasPeakRateWindows ? '---' : fallbackCurrentPrice)
  const peakPrice = peakRates.peak ?? (hasPeakRateWindows ? '---' : fallbackPriceDay.peak ?? data.peakRateNext)
  const displayDate = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  const displayTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const batterySoc = appendUnit(data.batterySoc, '%')
  const evSoc = appendUnit(data.evChargePercent, '%')
  const evRange = data.evRange
  const batteryFlowMeta = [data.batteryStatus, batterySoc !== '---' ? batterySoc : null].filter(Boolean).join(' · ')
  const insightControls = {
    canGoNext: true,
    canGoPrevious: true,
    mode: insightViewMode,
    onNext: () => setInsightDayOffset((current) => current + 1),
    onPrevious: () => setInsightDayOffset((current) => current - 1),
    onToggleMode: () => {
      setInsightViewMode((current) => (current === 'today' ? 'timeline' : 'today'))
      setInsightDayOffset(0)
    },
  }
  const solarForecastInsight = getSolarForecastInsight({
    mode: insightViewMode,
    now,
    offsetDays: insightDayOffset,
    source: solarForecast.source,
    windows: solarForecast.windows,
  })
  const energyPriceInsight = getEnergyPriceInsight({
    currentPrice,
    mode: insightViewMode,
    now,
    offsetDays: insightDayOffset,
    windows: peakRates.windows,
  })
  const evController = useEvChargerController({
    chargeMode: data.evccChargeMode,
    chargeModeOptions: data.evccChargeModeOptions,
    chargePlanEnabled: data.evccChargePlanEnabled,
    chargePlanFrom: data.evccChargePlanFrom,
    chargePlanTo: data.evccChargePlanTo,
    priceAverage: averagePrice,
    priceCurrent: currentPrice,
    priceDays,
    pricePeak: peakPrice,
    priceSeries: priceCurve,
  })

  if (isMobileView) {
    return (
      <MobileDashboard
        battery={{
          energy: data.batteryEnergy,
          power: data.batteryPower,
          soc: data.batterySoc,
          socValue: data.batterySocValue,
          status: data.batteryStatus,
        }}
        charger={{
          chargeRate: data.evChargePower,
          sessionDuration: data.evChargeSessionDuration,
          sessionEnergy: data.evChargeSessionEnergy,
          status: data.evChargeStatus,
        }}
        controller={evController}
        displayDate={displayDate}
        displayTime={displayTime}
        distribution={{
          battery: data.batteryEnergy,
          ev: todayTotals.evKwh,
          grid: todayTotals.gridKwh,
          home: todayTotals.homeKwh,
          solar: solarProductionEnergyKwh,
        }}
        overview={{
          batteryMeta: batteryFlowMeta,
          batteryPower: data.batteryPower,
          evMeta: data.evChargeStatus,
          evPower: data.evChargePower,
          gridMeta: data.gridStatus,
          gridPower: data.gridPower,
          homePower: data.homePower,
          solarPower: data.solarPower,
        }}
        prices={energyPriceInsight}
        solarForecast={solarForecastInsight}
        solarProduction={{
          curve: solarPowerCurve,
          value: solarProductionEnergyKwh,
        }}
      />
    )
  }

  return (
    <main className="dashboard-shell" style={shellStyle}>
      <div className="energy-scene overview-scene" style={sceneStyle}>
        <aside className="overview-sidebar" aria-label="Dashboard navigation">
          <div className="brand-lockup">
            <OverviewIcon name="home" />
            <strong>Home</strong>
          </div>
          <nav className="overview-nav">
            {NAV_ITEMS.map(({ active, icon, label }) => (
              <button className="nav-item" data-active={Boolean(active)} key={label} type="button">
                <OverviewIcon name={icon} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="overview-main" aria-label="Home energy overview">
          <header className="overview-header">
            <div>
              <h1>Overview</h1>
              <p>Live overview of your home energy system</p>
            </div>
            <div className="status-strip">
              <StatusPill icon="sun" primary="12.4 C" secondary="Clear sky" tone="sun" />
              <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
              <StatusPill primary="All systems" secondary="Normal" tone="ok" />
            </div>
          </header>

          <section className="house-stage" aria-label="Energy flow">
            <img
              className="overview-house"
              src={assetPath('/new-energy-dashboard/background.png')}
              alt="Night house with solar panels and home energy hardware"
            />
            <EnergyFlowMap
              batteryPowerValue={data.batteryPowerValue}
              evChargePowerValue={data.evChargePowerValue}
              gridPowerValue={data.gridPowerValue}
            />
            <FlowNode className="flow-solar" label="Solar" tone="sun" unit="kW" value={data.solarPower} />
            <FlowNode
              className="flow-grid"
              label="Grid"
              meta={data.gridStatus}
              tone="purple"
              unit="kW"
              value={data.gridPower}
            />
            <FlowNode className="flow-home" label="Home" tone="blue" unit="kW" value={data.homePower} />
            <FlowNode
              className="flow-battery"
              label="Battery"
              meta={batteryFlowMeta}
              tone="green"
              unit="kW"
              value={data.batteryPower}
            />
            <FlowNode
              className="flow-ev"
              label="EV"
              meta={data.evChargeStatus}
              tone="muted"
              unit="kW"
              value={data.evChargePower}
            />
          </section>

          <section className="bottom-overview-row" aria-label="Bottom analytics">
            <SolarForecastCard controls={insightControls} insight={solarForecastInsight} />
            <EnergyPricesCard controls={insightControls} insight={energyPriceInsight} />
            <EvChargerOverviewCard
              battery={evSoc}
              chargeRate={data.evChargePower}
              onOpen={openEvCharger}
              range="---"
              status={data.evChargeStatus}
            />
          </section>
        </section>

        <aside className="overview-right-rail" aria-label="Energy details">
          <EnergyDistributionPanel
            battery={data.batteryEnergy}
            ev={todayTotals.evKwh}
            grid={todayTotals.gridKwh}
            home={todayTotals.homeKwh}
            solar={solarProductionEnergyKwh}
          />
          <SolarProductionPanel curve={solarPowerCurve} value={solarProductionEnergyKwh} />
          <BatteryStatusPanel
            energy={data.batteryEnergy}
            power={data.batteryPower}
            soc={batterySoc}
            socValue={data.batterySocValue}
            status={data.batteryStatus}
          />
          <VehiclePanel battery={evSoc} range={evRange} />
        </aside>

        {isEvChargerOpen ? (
          <EvChargerModal
            chargeRate={data.evChargePower}
            controller={evController}
            onClose={closeEvCharger}
            sessionDuration={data.evChargeSessionDuration}
            sessionEnergy={data.evChargeSessionEnergy}
            status={data.evChargeStatus}
          />
        ) : null}
      </div>
    </main>
  )
}

function createFallbackPriceDay(date: Date): PeakRateDay {
  const dateKey = formatLocalDateKey(date)
  const average = FALLBACK_PRICE_CURVE.reduce((sum, price) => sum + price, 0) / FALLBACK_PRICE_CURVE.length
  const peak = Math.max(...FALLBACK_PRICE_CURVE)

  return {
    average: average.toFixed(2),
    date: dateKey,
    label: 'Today',
    peak: peak.toFixed(2),
    prices: FALLBACK_PRICE_CURVE.map((price, hour) => ({
      date: dateKey,
      endIso: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour + 1).toISOString(),
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      price,
      startIso: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).toISOString(),
    })),
  }
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`overview-panel ${className}`}>{children}</section>
}

function StatusPill({
  icon,
  primary,
  secondary,
  tone,
}: {
  icon?: IconName
  primary: string
  secondary: string
  tone?: 'ok' | 'sun'
}) {
  return (
    <div className="status-pill" data-tone={tone}>
      {icon ? <OverviewIcon name={icon} /> : <span className="status-dot" />}
      <div>
        <strong>{primary}</strong>
        <span>{secondary}</span>
      </div>
    </div>
  )
}

function EnergyFlowMap({
  batteryPowerValue,
  evChargePowerValue,
  gridPowerValue,
}: {
  batteryPowerValue: number | null
  evChargePowerValue: number | null
  gridPowerValue: number | null
}) {
  const gridDirection = gridPowerValue !== null && gridPowerValue < -0.05 ? 'reverse' : 'forward'
  const batteryDirection = batteryPowerValue !== null && batteryPowerValue < -0.05 ? 'reverse' : 'forward'
  const evState = evChargePowerValue !== null && Math.abs(evChargePowerValue) > 0.05 ? 'active' : 'idle'

  return (
    <svg className="overview-flow-map" viewBox="0 0 846 158" aria-hidden="true">
      <FlowPath className="line-solar" d="M186 28H300Q330 28 348 58" />
      <FlowPath className="line-home-battery" d="M484 58Q508 28 548 28H648" reverse={batteryDirection === 'reverse'} />
      <FlowPath
        className="line-grid"
        d="M186 112H300Q330 112 348 86"
        reverse={gridDirection === 'reverse'}
      />
      <FlowPath
        className="line-ev"
        d="M484 86Q508 112 548 112H648"
        state={evState}
      />
    </svg>
  )
}

function FlowPath({
  className,
  d,
  reverse = false,
  state = 'active',
}: {
  className: string
  d: string
  reverse?: boolean
  state?: 'active' | 'idle'
}) {
  return (
    <g className={`overview-flow-path ${className}`} data-direction={reverse ? 'reverse' : 'forward'} data-state={state}>
      <path className="flow-track" d={d} />
      <path className="flow-pulse" d={d} />
    </g>
  )
}

function FlowNode({
  className,
  label,
  meta,
  tone,
  unit,
  value,
}: {
  className: string
  label: string
  meta?: string
  tone: 'blue' | 'green' | 'muted' | 'purple' | 'sun'
  unit: string
  value: string
}) {
  return (
    <div className={`flow-node-card ${className}`} data-tone={tone}>
      <span className="flow-node-dot" aria-hidden="true" />
      <div className="flow-node-label">
        <span>{label}</span>
        <strong>
          {value}
          <small> {unit}</small>
        </strong>
        {meta ? <em>{meta}</em> : null}
      </div>
    </div>
  )
}

function EnergyDistributionPanel({
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

function SolarProductionPanel({ curve, value }: { curve: number[]; value: string }) {
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

function BatteryStatusPanel({
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

function VehiclePanel({ battery, range }: { battery: string, range: string }) {
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

function SolarForecastCard({
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
        <LineChart
          className="insight-line-chart"
          color="#f5a623"
          label="Solar forecast by hour"
          labels={insight.pointLabels}
          points={insight.points}
          unit="kWh"
        />
      </div>
    </Panel>
  )
}

function EnergyPricesCard({
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
        <LineChart
          className="insight-line-chart"
          color="#2f86ff"
          label="Energy prices by hour"
          labels={insight.pointLabels}
          points={insight.points}
          unit="DKK/kWh"
        />
      </div>
    </Panel>
  )
}

function InsightToolbar({
  controls,
  windowLabel,
}: {
  controls: InsightHeaderControls
  windowLabel: string
}) {
  return (
    <div className="insight-toolbar">
      <InsightWindowControls {...controls} />
      <small className="panel-window-chip">{windowLabel}</small>
    </div>
  )
}

function EvChargerOverviewCard({
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

function PanelHeader({
  controls,
  showPeriod = true,
  title,
}: {
  controls?: ReactNode
  showPeriod?: boolean
  title: string
}) {
  return (
    <header className="overview-panel-header">
      <h2>{title}</h2>
      {controls ? (
        controls
      ) : showPeriod ? (
        <span className="panel-period">
          Today
          <span aria-hidden="true">v</span>
        </span>
      ) : null}
    </header>
  )
}

function BarChart({
  className,
  label,
  labels,
  unit,
  values,
}: {
  className?: string
  label: string
  labels?: string[]
  unit: 'DKK/kWh' | 'kW' | 'kWh'
  values: number[]
}) {
  const bars = normalizeSeries(values)

  return (
    <div className={`overview-bar-chart ${className ?? ''}`} aria-label={label}>
      {bars.map((height, index) => (
        <button
          aria-label={`${formatChartXAxisLabel(labels, index)} ${formatChartValue(values[index] ?? 0, unit)}`}
          className="chart-hover-target"
          data-tooltip={`${formatChartXAxisLabel(labels, index)} · ${formatChartValue(values[index] ?? 0, unit)}`}
          key={index}
          style={{ height: `${height}%` }}
          type="button"
        />
      ))}
    </div>
  )
}

function LineChart({
  className,
  color,
  label,
  labels,
  points,
  unit,
}: {
  className?: string
  color: string
  label: string
  labels?: string[]
  points: number[]
  unit: 'DKK/kWh' | 'kW' | 'kWh'
}) {
  const polyline = getChartPolyline(points)

  return (
    <div className={`overview-line-chart ${className ?? ''}`.trim()} aria-label={label}>
      <svg viewBox="-4 0 318 120" aria-hidden="true">
        <defs>
          <linearGradient id={`line-fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${polyline.fill}Z`} fill={`url(#line-fill-${color.replace('#', '')})`} />
        <polyline
          fill="none"
          points={polyline.line}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {polyline.dots.map((point, index) => (
          <circle cx={point.x} cy={point.y} fill={color} key={index} r="3" />
        ))}
      </svg>
      <div className="chart-hit-grid">
        {points.map((point, index) => (
          <button
            aria-label={`${formatChartXAxisLabel(labels, index)} ${formatChartValue(point, unit)}`}
            className="chart-hover-target"
            data-tooltip={`${formatChartXAxisLabel(labels, index)} · ${formatChartValue(point, unit)}`}
            key={index}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

function normalizeSeries(values: number[]) {
  const max = Math.max(...values, 1)
  return values.map((value) => Math.max(2, (value / max) * 100))
}

function appendUnit(value: string, unit: string) {
  return value === '---' ? value : `${value}${unit}`
}

function formatChartXAxisLabel(labels: string[] | undefined, index: number) {
  return labels?.[index] ?? formatChartHour(index)
}

function formatChartHour(index: number) {
  return `${index.toString().padStart(2, '0')}:00`
}

function formatChartValue(value: number, unit: 'DKK/kWh' | 'kW' | 'kWh') {
  return `${value.toFixed(2)} ${unit}`
}

function getChartPolyline(values: number[]) {
  const normalizedValues = values.length ? values : [0]
  const max = Math.max(...normalizedValues, 1)
  const width = 310
  const height = 92
  const offsetY = 12
  const step = width / Math.max(1, normalizedValues.length)
  const dots = normalizedValues.map((value, index) => ({
    x: Number((step * (index + 0.5)).toFixed(1)),
    y: Number((offsetY + height - (value / max) * height).toFixed(1)),
  }))
  const firstPoint = dots[0]
  const lastPoint = dots[dots.length - 1]
  const linePoints = [
    { x: 0, y: firstPoint.y },
    ...dots,
    { x: width, y: lastPoint.y },
  ]
  const line = linePoints.map((point) => `${point.x},${point.y}`).join(' ')
  const fill = `M0,120 L${line.replaceAll(' ', ' L')} L${width},120 `

  return { dots: dots.filter((_, index) => index % 3 === 0), fill, line }
}

type InsightHeaderControls = {
  canGoNext: boolean
  canGoPrevious: boolean
  mode: InsightViewMode
  onNext: () => void
  onPrevious: () => void
  onToggleMode: () => void
}

type InsightMetricItem = {
  label: string
  value: string
}

type SolarForecastInsight = {
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  summaryItems: InsightMetricItem[]
  totalKwh: string
  windowLabel: string
}

type EnergyPriceInsight = {
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  primaryValue: string
  summaryItems: InsightMetricItem[]
  windowLabel: string
}

function InsightWindowControls({
  canGoNext,
  canGoPrevious,
  mode,
  onNext,
  onPrevious,
  onToggleMode,
}: InsightHeaderControls) {
  return (
    <div className="insight-window-controls" role="group" aria-label="Insight time range controls">
      <button
        aria-label="Show previous insight window"
        className="insight-window-arrow"
        disabled={!canGoPrevious}
        type="button"
        onClick={onPrevious}
      >
        ‹
      </button>
      <button
        aria-label={`Switch to ${mode === 'today' ? 'timeline' : 'today overview'}`}
        className="insight-window-toggle"
        type="button"
        onClick={onToggleMode}
      >
        {mode === 'today' ? 'Today overview' : 'Timeline'}
      </button>
      <button aria-label="Show next insight window" className="insight-window-arrow" disabled={!canGoNext} type="button" onClick={onNext}>
        ›
      </button>
    </div>
  )
}

function getSolarForecastInsight({
  mode,
  now,
  offsetDays,
  source,
  windows,
}: {
  mode: InsightViewMode
  now: Date
  offsetDays: number
  source: 'evcc' | 'open-meteo'
  windows: SolarForecastWindow[]
}): SolarForecastInsight {
  const { labels, startMs, values } = getSolarForecastBuckets(windows, now, mode, offsetDays)
  const totalKwh = formatInsightNumber(values.reduce((sum, value) => sum + value, 0))
  const isTodayOverview = mode === 'today' && offsetDays === 0
  const isLiveTimeline = mode === 'timeline' && offsetDays === 0
  const activePowerWindow =
    windows.find((window) => {
      const start = Date.parse(window.time)
      const end = Date.parse(window.endTime)
      return start <= now.getTime() && now.getTime() < end
    }) ?? null
  const windowPeakKw = getSolarPeakKw(windows, startMs, startMs + DAY_MS)
  const summaryItems =
    isLiveTimeline
      ? [
          { label: 'Now', value: `${formatInsightNumber(activePowerWindow?.powerKw ?? 0)} kW` },
          { label: '24h peak', value: `${formatInsightNumber(windowPeakKw)} kW` },
        ]
      : isTodayOverview && source === 'evcc'
        ? [
            { label: 'Power', value: `${formatInsightNumber(activePowerWindow?.powerKw ?? 0)} kW` },
            { label: 'Day peak', value: `${formatInsightNumber(windowPeakKw)} kW` },
          ]
        : [{ label: mode === 'timeline' ? 'Window peak' : 'Day peak', value: `${formatInsightNumber(windowPeakKw)} kW` }]

  return {
    pointLabels: labels,
    points: values,
    primaryLabel: isLiveTimeline
      ? 'Forecast for the next 24 hours'
      : isTodayOverview && source === 'evcc'
        ? 'Remaining forecast'
        : mode === 'timeline'
          ? 'Forecast for this 24 hour window'
          : 'Forecast for selected day',
    summaryItems,
    totalKwh,
    windowLabel: formatInsightWindowLabel(now, mode, offsetDays),
  }
}

function getEnergyPriceInsight({
  currentPrice,
  mode,
  now,
  offsetDays,
  windows,
}: {
  currentPrice: string
  mode: InsightViewMode
  now: Date
  offsetDays: number
  windows: PeakRateWindow[]
}): EnergyPriceInsight {
  const { labels, startMs, values } = getPeakRateBuckets(windows, now, mode, offsetDays)
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  const peak = values.length ? Math.max(...values) : 0
  const low = values.length ? Math.min(...values) : 0
  const isTodayOverview = mode === 'today' && offsetDays === 0
  const isLiveTimeline = mode === 'timeline' && offsetDays === 0
  const requestedStartMs = getInsightWindowStartMs(now, mode, offsetDays)
  const isSelectedWindow = startMs === requestedStartMs

  return {
    pointLabels: labels,
    points: values,
    primaryLabel: isLiveTimeline
      ? 'Average for the next 24 hours'
      : isTodayOverview && isSelectedWindow
        ? 'Average price today'
        : mode === 'today'
          ? 'Average price for published day'
        : mode === 'timeline'
          ? 'Average for this 24 hour window'
          : 'Average price for selected day',
    primaryValue: formatInsightPrice(average),
    summaryItems: isLiveTimeline && isSelectedWindow
      ? [
          { label: 'Now', value: `${currentPrice} DKK` },
          { label: '24h peak', value: `${formatInsightPrice(peak)} DKK` },
        ]
      : isTodayOverview && isSelectedWindow
        ? [
            { label: 'Now', value: `${currentPrice} DKK` },
            { label: 'Day peak', value: `${formatInsightPrice(peak)} DKK` },
          ]
        : [
            { label: 'Low', value: `${formatInsightPrice(low)} DKK` },
            { label: 'Peak', value: `${formatInsightPrice(peak)} DKK` },
          ],
    windowLabel: formatInsightWindowLabelForStart(now, mode, startMs),
  }
}

function getSolarForecastBuckets(
  windows: SolarForecastWindow[],
  now: Date,
  mode: InsightViewMode,
  offsetDays: number,
) {
  const startMs = getInsightWindowStartMs(now, mode, offsetDays)
  const values = Array.from({ length: 24 }, (_, index) => {
    const bucketStart = startMs + index * 3_600_000
    const bucketEnd = bucketStart + 3_600_000
    return Number(sumSolarOverlapKwh(windows, bucketStart, bucketEnd).toFixed(2))
  })

  return {
    labels: Array.from({ length: 24 }, (_, index) => formatBucketLabel(startMs + index * 3_600_000, mode)),
    startMs,
    values,
  }
}

function getPeakRateBuckets(windows: PeakRateWindow[], now: Date, mode: InsightViewMode, offsetDays: number) {
  const requestedStartMs = getInsightWindowStartMs(now, mode, offsetDays)
  let startMs = requestedStartMs
  let values = buildPeakRateBucketValues(windows, startMs)

  if (!values.some((value) => value > 0) && windows.length > 0) {
    const fallbackStartMs = getFirstPublishedPeakRateStart(windows, requestedStartMs, mode)

    if (fallbackStartMs !== null) {
      startMs = fallbackStartMs
      values = buildPeakRateBucketValues(windows, startMs)
    }
  }

  return {
    labels: Array.from({ length: 24 }, (_, index) => formatBucketLabel(startMs + index * 3_600_000, mode)),
    startMs,
    values,
  }
}

function buildPeakRateBucketValues(windows: PeakRateWindow[], startMs: number) {
  return Array.from({ length: 24 }, (_, index) => {
    const bucketStart = startMs + index * 3_600_000
    const bucketEnd = bucketStart + 3_600_000
    const activeWindow = windows.find((window) => window.startMs < bucketEnd && window.endMs > bucketStart)
    return Number((activeWindow?.price ?? 0).toFixed(2))
  })
}

function getFirstPublishedPeakRateStart(windows: PeakRateWindow[], requestedStartMs: number, mode: InsightViewMode) {
  const firstWindow = windows.find((window) => window.endMs > requestedStartMs) ?? windows[0] ?? null

  if (!firstWindow) {
    return null
  }

  if (mode === 'today') {
    const localDate = new Date(firstWindow.startMs)
    return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()).getTime()
  }

  return firstWindow.startMs
}

function getInsightWindowStartMs(now: Date, mode: InsightViewMode, offsetDays: number) {
  if (mode === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return startOfDay.getTime() + offsetDays * DAY_MS
  }

  return now.getTime() + offsetDays * DAY_MS
}

function formatInsightWindowLabel(now: Date, mode: InsightViewMode, offsetDays: number) {
  return formatInsightWindowLabelForStart(now, mode, getInsightWindowStartMs(now, mode, offsetDays))
}

function formatInsightWindowLabelForStart(now: Date, mode: InsightViewMode, startMs: number) {
  if (mode === 'today') {
    const date = new Date(startMs)
    const dayDelta = Math.round((startMs - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / DAY_MS)
    const dateText = date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    })

    if (dayDelta === 0) {
      return `Today · ${dateText}`
    }

    if (dayDelta === -1) {
      return `Yesterday · ${dateText}`
    }

    if (dayDelta === 1) {
      return `Tomorrow · ${dateText}`
    }

    return dateText
  }

  const end = new Date(startMs + DAY_MS)
  return `${formatTimelineLabel(startMs)} -> ${formatTimelineLabel(end.getTime())}`
}

function formatBucketLabel(timestamp: number, mode: InsightViewMode) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: mode === 'timeline' ? '2-digit' : undefined,
  })
}

function formatTimelineLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  })
}

function sumSolarOverlapKwh(windows: SolarForecastWindow[], bucketStartMs: number, bucketEndMs: number) {
  return windows.reduce((sum, window) => {
    const startMs = Date.parse(window.time)
    const endMs = Date.parse(window.endTime)

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return sum
    }

    const overlapMs = Math.max(0, Math.min(bucketEndMs, endMs) - Math.max(bucketStartMs, startMs))

    if (overlapMs <= 0) {
      return sum
    }

    return sum + window.powerKw * (overlapMs / 3_600_000)
  }, 0)
}

function getSolarPeakKw(windows: SolarForecastWindow[], startMs: number, endMs: number) {
  return windows.reduce((max, window) => {
    const windowStartMs = Date.parse(window.time)
    const windowEndMs = Date.parse(window.endTime)

    if (windowEndMs <= startMs || windowStartMs >= endMs) {
      return max
    }

    return Math.max(max, window.powerKw)
  }, 0)
}

function formatInsightNumber(value: number) {
  return value.toFixed(1)
}

function formatInsightPrice(value: number) {
  return value.toFixed(2)
}

function OverviewIcon({ name }: { name: IconName }) {
  return (
    <svg className="overview-icon" viewBox="0 0 24 24" aria-hidden="true">
      {renderOverviewIcon(name)}
    </svg>
  )
}

function renderOverviewIcon(name: IconName) {
  switch (name) {
    case 'battery':
      return <path d="M8 6h8v2h2v12H6V8h2V6Zm1 6h6M12 10v8" />
    case 'bolt':
      return <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" fill="currentColor" stroke="none" />
    case 'car':
      return (
        <>
          <path d="M4 13h16l-2-5H7l-3 5Zm0 0v5h3m10 0h3v-5M8 18h8" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="16" cy="18" r="2" />
        </>
      )
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l4 2" />
        </>
      )
    case 'grid':
      return <path d="M12 3 6 21m6-18 6 18M5 21h14M7 15h10M8.5 10h7M6 7h12l-6-4-6 4Z" />
    case 'history':
      return <path d="M4 12a8 8 0 1 0 2.3-5.6M4 5v5h5M12 8v5l3 2" />
    case 'home':
      return <path d="M3 11 12 4l9 7v9h-6v-6H9v6H3v-9Z" fill="currentColor" stroke="none" />
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.6 1l-2.5-1-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.5-1a7 7 0 0 0 1.6 1l.4 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </>
      )
    case 'solar':
      return (
        <>
          <circle cx="12" cy="6" r="2.5" />
          <path d="M12 1v2M12 9v2M7 6H5m14 0h-2M8.5 2.5 10 4M14 8l1.5 1.5M15.5 2.5 14 4M10 8 8.5 9.5M6 13h12l2 7H4l2-7Zm4 0-1 7m5-7 1 7M5 17h14" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </>
      )
    case 'zap':
      return <path d="m13 2-8 12h6l-1 8 9-14h-6V2Z" fill="currentColor" stroke="none" />
  }
}
