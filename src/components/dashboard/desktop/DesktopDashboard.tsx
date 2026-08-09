import type { CSSProperties } from 'react'
import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import type { DataStateBadgeModel } from '../../../models/dataState'
import type { EnergyPriceInsight, InsightHeaderControls, SolarForecastInsight } from '../../../models/dashboardInsights'
import type { EvChargerController } from '../../../models/evChargePlan'
import type { NotificationPreferences, NotificationsState } from '../../../models/notifications'
import { assetPath } from '../../../utils/assetPath'
import { EvChargerModal } from '../../EvChargerModal'
import { DesktopNotificationsPage } from '../../notifications/NotificationsScreen'
import { DesktopBatteryPage } from './DesktopBatteryPage'
import { DesktopSettingsPage } from './DesktopSettingsPage'
import { DesktopTopNavigation } from './DesktopTopNavigation'
import { EnergyFlowMap, FlowNode } from './DesktopFlow'
import type { DayHeaderControls } from './DesktopShared'
import {
  BatteryStatusPanel,
  EnergyDistributionPanel,
  EnergyPricesCard,
  EvChargerOverviewCard,
  SolarForecastCard,
  SolarProductionPanel,
  MarketRatesPanel,
} from './DesktopPanels'
import { StatusPill } from './DesktopShared'

type DesktopTab = 'battery' | 'notifications' | 'overview' | 'settings'

export type DesktopDashboardProps = {
  battery: {
    capacity: string
    dataState: DataStateBadgeModel
    energy: string
    meta: string
    power: string
    powerValue: number | null
    soc: string
    socValue: number
    status: string
  }
  batteryHistory: {
    day: { labels: string[]; points: number[] }
    error: string | null
    month: { labels: string[]; points: number[] }
    quarter: { labels: string[]; points: number[] }
    source: 'ha' | 'unavailable'
    week: { labels: string[]; points: number[] }
  }
  batteryOptimizer: BatteryOptimizerState
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
  energyDayControls: DayHeaderControls
  distribution: {
    battery: string
    batteryCharge: string
    batteryDischarge: string
    dataState: DataStateBadgeModel
    ev: string
    gridExport: string
    gridImport: string
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
  notificationPreferences: NotificationPreferences
  notifications: NotificationsState & {
    disable: () => Promise<boolean>
    enable: () => Promise<boolean>
    refresh: () => Promise<boolean>
  }
  onNotificationPreferenceChange: (key: keyof NotificationPreferences, value: boolean) => void
  onCloseEvCharger: () => void
  onOpenEvCharger: () => void
  weather: {
    condition: string
    dataState: DataStateBadgeModel
    temperature: string
  }
  sceneStyle: CSSProperties
  shellStyle: CSSProperties
  solar: {
    forecast: SolarForecastInsight
    power: string
    production: {
      curve: number[]
      dataState: DataStateBadgeModel
      labels: string[]
      value: string
    }
  }
  prices: EnergyPriceInsight
}

export function DesktopDashboard({
  battery,
  batteryHistory,
  batteryOptimizer,
  charger,
  controller,
  displayDate,
  displayTime,
  energyDayControls,
  distribution,
  grid,
  homePower,
  insightControls,
  isEvChargerOpen,
  notificationPreferences,
  notifications,
  onNotificationPreferenceChange,
  onCloseEvCharger,
  onOpenEvCharger,
  prices,
  sceneStyle,
  shellStyle,
  solar,
  weather,
}: DesktopDashboardProps) {
  const [activeTab, setActiveTab] = useState<DesktopTab>('overview')
  const openBatteryPage = () => setActiveTab('battery')

  const usesFixedOverviewCanvas = activeTab === 'overview'

  return (
    <main className={usesFixedOverviewCanvas ? 'relative grid place-items-center overflow-hidden' : 'relative h-screen w-screen overflow-hidden'} style={usesFixedOverviewCanvas ? shellStyle : undefined}>
      <div className={usesFixedOverviewCanvas ? 'absolute left-1/2 top-1/2 h-[941px] w-[1672px] -translate-x-1/2 -translate-y-1/2 overflow-hidden' : 'absolute inset-0 overflow-hidden'}>
        <div
          className={usesFixedOverviewCanvas ? 'relative h-[941px] w-[1672px] overflow-hidden bg-[radial-gradient(circle_at_48%_25%,rgba(45,63,80,0.22),transparent_31%),linear-gradient(180deg,#060a0f,#030509_62%,#030407)] font-sans tracking-[0] text-dashboard-text' : 'relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_48%_25%,rgba(45,63,80,0.22),transparent_31%),linear-gradient(180deg,#060a0f,#030509_62%,#030407)] font-sans tracking-[0] text-dashboard-text'}
          style={usesFixedOverviewCanvas ? sceneStyle : undefined}
        >
        {activeTab === 'overview' ? (
          <>
            <section
              className="absolute left-0 top-0 h-[941px] w-[1172px] px-[28px] pb-3 pr-3 pt-6"
              aria-label="Home energy overview"
            >
              <header className="flex h-[70px] items-start justify-between">
                <div>
                  <h1 className="m-0 text-[24px] leading-[1.1] text-white">Overview</h1>
                  <p className="mt-[7px] text-[15px] text-[#d7dbe1]">Live overview of your home energy system</p>
                </div>
                <DesktopTopNavigation active="overview" onOpenEvCharger={onOpenEvCharger} onSelect={setActiveTab} />
                <div className="fixed left-[1196px] top-[24px] z-[3] grid grid-cols-[120px_138px_138px] gap-5">
                  <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
                  <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
                  <StatusPill primary="All systems" secondary="Normal" tone="ok" />
                </div>
              </header>

              <section className="relative h-[575px]" aria-label="Energy flow">
                <img
                  className="absolute left-[18px] top-[46px] h-[344px] w-[900px] select-none object-cover object-center"
                  src={assetPath('/new-energy-dashboard/background.png')}
                  alt="Night house with solar panels and home energy hardware"
                />
                <EnergyFlowMap
                  batteryPowerValue={battery.powerValue}
                  evChargePowerValue={charger.powerValue}
                  gridPowerValue={grid.powerValue}
                />
                <FlowNode className="left-[80px] top-[368px]" label="Solar" tone="sun" unit="kW" value={solar.power} />
                <FlowNode className="left-[80px] top-[466px]" label="Grid" meta={grid.status} tone="purple" unit="kW" value={grid.power} />
                <FlowNode className="left-[384px] top-[412px]" label="Home" tone="blue" unit="kW" value={homePower} />
                <FlowNode
                  className="left-[706px] top-[352px]"
                  label="Battery"
                  badge={battery.soc}
                  meta={battery.status}
                  tone="green"
                  unit="kW"
                  value={battery.power}
                />
                <FlowNode
                  className="left-[706px] top-[462px]"
                  label="EV"
                  meta={charger.status}
                  tone="muted"
                  unit="kW"
                  value={charger.chargeRate}
                />
              </section>

              <section
                className="absolute bottom-3 left-3 right-[10px] grid h-[264px] grid-cols-[320px_330px_248px] gap-[10px]"
                aria-label="Bottom analytics"
              >
                <SolarForecastCard badge={solar.forecast.dataState} controls={insightControls} insight={solar.forecast} />
                <EnergyPricesCard badge={prices.dataState} controls={insightControls} insight={prices} />
                <EvChargerOverviewCard
                  battery={charger.battery}
                  chargeRate={charger.chargeRate}
                  onOpen={onOpenEvCharger}
                  range={charger.range}
                  status={charger.status}
                />
              </section>
            </section>

            <aside className="absolute right-4 top-[96px] grid w-[484px] gap-[10px]" aria-label="Energy details">
              <EnergyDistributionPanel
                battery={distribution.battery}
                batteryCharge={distribution.batteryCharge}
                batteryDischarge={distribution.batteryDischarge}
                badge={distribution.dataState}
                controls={energyDayControls}
                ev={distribution.ev}
                gridExport={distribution.gridExport}
                gridImport={distribution.gridImport}
                home={distribution.home}
                solar={distribution.solar}
              />
              <SolarProductionPanel
                badge={solar.production.dataState}
                controls={energyDayControls}
                curve={solar.production.curve}
                labels={solar.production.labels}
                value={solar.production.value}
              />
              <BatteryStatusPanel
                badge={battery.dataState}
                capacity={battery.capacity}
                energy={battery.energy}
                onOpen={openBatteryPage}
                power={battery.power}
                soc={battery.soc}
                socValue={battery.socValue}
                status={battery.status}
              />
              <MarketRatesPanel optimizer={batteryOptimizer} prices={prices} />
            </aside>
          </>
        ) : activeTab === 'battery' ? (
          <DesktopBatteryPage
            battery={battery}
            batteryHistory={batteryHistory}
            batteryOptimizer={batteryOptimizer}
            displayDate={displayDate}
            displayTime={displayTime}
            distribution={{
              batteryCharge: distribution.batteryCharge,
              batteryDischarge: distribution.batteryDischarge,
              gridExport: distribution.gridExport,
              gridImport: distribution.gridImport,
            }}
            flow={{
              evPower: charger.chargeRate,
              evStatus: charger.status,
              gridPower: grid.power,
              gridStatus: grid.status,
              homePower,
              solarPower: solar.power,
            }}
            onGoOverview={() => setActiveTab('overview')}
            onOpenEvCharger={onOpenEvCharger}
            onOpenNotifications={() => setActiveTab('notifications')}
            onOpenSettings={() => setActiveTab('settings')}
            weather={weather}
          />
        ) : activeTab === 'settings' ? (
          <DesktopSettingsPage
            displayDate={displayDate}
            displayTime={displayTime}
            optimizer={batteryOptimizer}
            weather={weather}
            onGoBattery={() => setActiveTab('battery')}
            onGoOverview={() => setActiveTab('overview')}
            onOpenEvCharger={onOpenEvCharger}
            onOpenNotifications={() => setActiveTab('notifications')}
          />
        ) : (
          <DesktopNotificationsPage
            controller={notifications}
            displayDate={displayDate}
            displayTime={displayTime}
            notifications={notifications}
            preferences={notificationPreferences}
            setPreference={onNotificationPreferenceChange}
            weather={weather}
            onGoBattery={() => setActiveTab('battery')}
            onGoOverview={() => setActiveTab('overview')}
            onOpenEvCharger={onOpenEvCharger}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

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
      </div>
    </main>
  )
}
