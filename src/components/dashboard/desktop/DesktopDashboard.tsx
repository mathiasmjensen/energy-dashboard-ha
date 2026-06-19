import type { CSSProperties } from 'react'
import type { EvChargerController } from '../../../hooks/useEvChargerController'
import type { EnergyPriceInsight, InsightHeaderControls, SolarForecastInsight } from '../../../services/dashboardInsights'
import { assetPath } from '../../../utils/assetPath'
import { EvChargerModal } from '../../EvChargerModal'
import { EnergyFlowMap, FlowNode } from './DesktopFlow'
import {
  BatteryStatusPanel,
  EnergyDistributionPanel,
  EnergyPricesCard,
  EvChargerOverviewCard,
  SolarForecastCard,
  SolarProductionPanel,
  VehiclePanel,
} from './DesktopPanels'
import { OverviewIcon, StatusPill } from './DesktopShared'

const NAV_ITEMS = [{ active: true, icon: 'home' as const, label: 'Overview' }]

export type DesktopDashboardProps = {
  battery: {
    capacity: string
    energy: string
    meta: string
    power: string
    powerValue: number | null
    soc: string
    socValue: number
    status: string
  }
  charger: {
    battery: string
    chargeRate: string
    powerValue: number | null
    range: string
    sessionDuration: string
    sessionEnergy: string
    status: string
  }
  controller: EvChargerController
  displayDate: string
  displayTime: string
  distribution: {
    battery: string
    ev: string
    grid: string
    home: string
    solar: string
  }
  grid: {
    power: string
    powerValue: number | null
    status: string
  }
  homePower: string
  insightControls: InsightHeaderControls
  isEvChargerOpen: boolean
  onCloseEvCharger: () => void
  onOpenEvCharger: () => void
  sceneStyle: CSSProperties
  shellStyle: CSSProperties
  solar: {
    forecast: SolarForecastInsight
    power: string
    production: {
      curve: number[]
      value: string
    }
  }
  prices: EnergyPriceInsight
}

export function DesktopDashboard({
  battery,
  charger,
  controller,
  displayDate,
  displayTime,
  distribution,
  grid,
  homePower,
  insightControls,
  isEvChargerOpen,
  onCloseEvCharger,
  onOpenEvCharger,
  prices,
  sceneStyle,
  shellStyle,
  solar,
}: DesktopDashboardProps) {
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
              batteryPowerValue={battery.powerValue}
              evChargePowerValue={charger.powerValue}
              gridPowerValue={grid.powerValue}
            />
            <FlowNode className="flow-solar" label="Solar" tone="sun" unit="kW" value={solar.power} />
            <FlowNode className="flow-grid" label="Grid" meta={grid.status} tone="purple" unit="kW" value={grid.power} />
            <FlowNode className="flow-home" label="Home" tone="blue" unit="kW" value={homePower} />
            <FlowNode className="flow-battery" label="Battery" meta={battery.meta} tone="green" unit="kW" value={battery.power} />
            <FlowNode className="flow-ev" label="EV" meta={charger.status} tone="muted" unit="kW" value={charger.chargeRate} />
          </section>

          <section className="bottom-overview-row" aria-label="Bottom analytics">
            <SolarForecastCard controls={insightControls} insight={solar.forecast} />
            <EnergyPricesCard controls={insightControls} insight={prices} />
            <EvChargerOverviewCard
              battery={charger.battery}
              chargeRate={charger.chargeRate}
              onOpen={onOpenEvCharger}
              range={charger.range}
              status={charger.status}
            />
          </section>
        </section>

        <aside className="overview-right-rail" aria-label="Energy details">
          <EnergyDistributionPanel
            battery={distribution.battery}
            ev={distribution.ev}
            grid={distribution.grid}
            home={distribution.home}
            solar={distribution.solar}
          />
          <SolarProductionPanel curve={solar.production.curve} value={solar.production.value} />
          <BatteryStatusPanel
            capacity={battery.capacity}
            energy={battery.energy}
            power={battery.power}
            soc={battery.soc}
            socValue={battery.socValue}
            status={battery.status}
          />
          <VehiclePanel battery={charger.battery} range={charger.range} />
        </aside>

        {isEvChargerOpen ? (
          <EvChargerModal
            chargeRate={charger.chargeRate}
            controller={controller}
            onClose={onCloseEvCharger}
            sessionDuration={charger.sessionDuration}
            sessionEnergy={charger.sessionEnergy}
            status={charger.status}
          />
        ) : null}
      </div>
    </main>
  )
}
