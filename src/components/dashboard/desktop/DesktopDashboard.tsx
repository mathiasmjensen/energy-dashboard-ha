import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import type { DataStateBadgeModel } from '../../../models/dataState'
import type { EnergyPriceInsight, InsightHeaderControls, SolarForecastInsight } from '../../../models/dashboardInsights'
import type { EvChargerController } from '../../../models/evChargePlan'
import type { NotificationPreferences, NotificationsState } from '../../../models/notifications'
import { assetPath } from '../../../utils/assetPath'
import { DesktopNotificationsPage } from '../../notifications/NotificationsScreen'
import { DesktopBatteryPage } from './DesktopBatteryPage'
import { DesktopEvChargerPage } from './DesktopEvChargerPage'
import { DesktopSettingsPage } from './DesktopSettingsPage'
import { DesktopPageHeader } from './DesktopPageHeader'
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

type DesktopTab = 'battery' | 'ev' | 'notifications' | 'overview' | 'settings'

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
  notificationPreferences: NotificationPreferences
  notifications: NotificationsState & {
    disable: () => Promise<boolean>
    enable: () => Promise<boolean>
    refresh: () => Promise<boolean>
  }
  onNotificationPreferenceChange: (key: keyof NotificationPreferences, value: boolean) => void
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
  notificationPreferences,
  notifications,
  onNotificationPreferenceChange,
  prices,
  sceneStyle,
  shellStyle,
  solar,
  weather,
}: DesktopDashboardProps) {
  const [activeTab, setActiveTab] = useState<DesktopTab>(() => getDesktopTabFromLocation())
  const selectTab = (tab: DesktopTab) => {
    if (tab === 'ev') {
      if (window.location.hash !== '#/ev-charger') {
        window.location.hash = '/ev-charger'
      }
    } else if (window.location.hash === '#/ev-charger') {
      window.history.pushState({}, '', `${window.location.pathname}${window.location.search}`)
    }
    setActiveTab(tab)
  }
  const openBatteryPage = () => selectTab('battery')

  useEffect(() => {
    const syncFromLocation = () => setActiveTab(getDesktopTabFromLocation())
    window.addEventListener('hashchange', syncFromLocation)
    window.addEventListener('popstate', syncFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncFromLocation)
      window.removeEventListener('popstate', syncFromLocation)
    }
  }, [])

  return (
    <main className="relative grid place-items-center overflow-hidden" style={shellStyle}>
      <div className="absolute left-1/2 top-1/2 h-[941px] w-[1672px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
        <div
          className="relative h-[941px] w-[1672px] overflow-hidden bg-[radial-gradient(circle_at_48%_25%,rgba(45,63,80,0.22),transparent_31%),linear-gradient(180deg,#060a0f,#030509_62%,#030407)] font-sans tracking-[0] text-dashboard-text"
          style={sceneStyle}
        >
        {activeTab === 'overview' ? (
          <>
            <DesktopPageHeader
              active="overview"
              displayDate={displayDate}
              displayTime={displayTime}
              onSelect={selectTab}
              subtitle="Live overview of your home energy system"
              title="Overview"
              weather={weather}
            />
            <section
              className="absolute left-0 top-[94px] h-[575px] w-[1172px] px-[28px] pr-3"
              aria-label="Home energy overview"
            >
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

            </section>

            <section
              className="absolute bottom-3 left-7 grid h-[264px] w-[1128px] grid-cols-[360px_390px_350px] gap-[14px]"
              aria-label="Bottom analytics"
            >
              <SolarForecastCard badge={solar.forecast.dataState} controls={insightControls} insight={solar.forecast} />
              <EnergyPricesCard badge={prices.dataState} controls={insightControls} insight={prices} />
              <EvChargerOverviewCard
                battery={charger.battery}
                chargeRate={charger.chargeRate}
                onOpen={() => selectTab('ev')}
                range={charger.range}
                status={charger.status}
              />
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
            onGoOverview={() => selectTab('overview')}
            onOpenEvCharger={() => selectTab('ev')}
            onOpenNotifications={() => selectTab('notifications')}
            onOpenSettings={() => selectTab('settings')}
            weather={weather}
          />
        ) : activeTab === 'ev' ? (
          <DesktopEvChargerPage
            charger={charger}
            controller={controller}
            displayDate={displayDate}
            displayTime={displayTime}
            onSelect={selectTab}
            weather={weather}
          />
        ) : activeTab === 'settings' ? (
          <DesktopSettingsPage
            displayDate={displayDate}
            displayTime={displayTime}
            optimizer={batteryOptimizer}
            weather={weather}
            onGoBattery={() => selectTab('battery')}
            onGoOverview={() => selectTab('overview')}
            onOpenEvCharger={() => selectTab('ev')}
            onOpenNotifications={() => selectTab('notifications')}
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
            onGoBattery={() => selectTab('battery')}
            onGoOverview={() => selectTab('overview')}
            onOpenEvCharger={() => selectTab('ev')}
            onOpenSettings={() => selectTab('settings')}
          />
        )}
        </div>
      </div>
    </main>
  )
}

function getDesktopTabFromLocation(): DesktopTab {
  return typeof window !== 'undefined' && window.location.hash === '#/ev-charger' ? 'ev' : 'overview'
}
