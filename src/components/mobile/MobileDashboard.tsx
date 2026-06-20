import { useMemo, useState } from 'react'
import { MobileBatteryScreen } from './MobileBatteryScreen'
import { MobileEvScreen } from './MobileEvScreen'
import { MobileHomeScreen } from './MobileHomeScreen'
import { MobileBottomNav } from './MobilePrimitives'
import { MobileSolarScreen } from './MobileSolarScreen'
import type { BatteryPeriod, MobileDashboardProps, MobileTab, SolarPeriod } from './MobileTypes'
import { getBatteryHistorySeries, getBatteryInsights } from './MobileUtils'

export function MobileDashboard({
  battery,
  charger,
  controller,
  displayDate,
  displayTime,
  insightControls,
  distribution,
  overview,
  prices,
  solarForecast,
  solarProduction,
  weather,
}: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('home')
  const [solarPeriod, setSolarPeriod] = useState<SolarPeriod>('Day')
  const [batteryPeriod, setBatteryPeriod] = useState<BatteryPeriod>('Day')
  const batteryInsights = useMemo(() => getBatteryInsights(battery), [battery])
  const batteryHistory = useMemo(() => getBatteryHistorySeries(battery.socValue, batteryPeriod), [battery.socValue, batteryPeriod])

  return (
    <main className="mobile-dashboard" data-testid="mobile-dashboard">
      <div className="mobile-app-shell">
        <section className="mobile-tab-panel" data-tab={activeTab} data-testid={`mobile-tab-${activeTab}`} key={activeTab}>
          {activeTab === 'home' ? (
            <MobileHomeScreen
              battery={battery}
              displayDate={displayDate}
              displayTime={displayTime}
              insightControls={insightControls}
              overview={overview}
              prices={prices}
              solarForecast={solarForecast}
              weather={weather}
            />
          ) : null}

          {activeTab === 'solar' ? (
            <MobileSolarScreen
              distribution={distribution}
              insightControls={insightControls}
              overview={overview}
              period={solarPeriod}
              prices={prices}
              solarForecast={solarForecast}
              solarProduction={solarProduction}
              onPeriodChange={setSolarPeriod}
            />
          ) : null}

          {activeTab === 'battery' ? (
            <MobileBatteryScreen
              battery={battery}
              history={batteryHistory}
              insights={batteryInsights}
              period={batteryPeriod}
              onPeriodChange={setBatteryPeriod}
            />
          ) : null}

          {activeTab === 'ev' ? <MobileEvScreen batterySoc={battery.soc} charger={charger} controller={controller} /> : null}
        </section>

        <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  )
}
