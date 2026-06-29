import { useMemo, useState } from 'react'
import { MobileBatteryScreen } from './MobileBatteryScreen'
import { MobileEvScreen } from './MobileEvScreen'
import { MobileHomeScreen } from './MobileHomeScreen'
import { MobileNotificationsScreen } from '../notifications/NotificationsScreen'
import { MobileBottomNav } from './MobilePrimitives'
import { MobileSolarScreen } from './MobileSolarScreen'
import type { BatteryPeriod, MobileDashboardProps, MobileTab, SolarPeriod } from './MobileTypes'
import { getBatteryInsights } from './MobileUtils'

export function MobileDashboard({
  battery,
  batteryOptimizer,
  batteryHistory,
  charger,
  controller,
  displayDate,
  displayTime,
  energyDayControls,
  insightControls,
  distribution,
  overview,
  notificationPreferences,
  notifications,
  onNotificationPreferenceChange,
  prices,
  solarForecast,
  solarProduction,
  weather,
}: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('home')
  const [solarPeriod, setSolarPeriod] = useState<SolarPeriod>('Day')
  const [batteryPeriod, setBatteryPeriod] = useState<BatteryPeriod>('Day')
  const batteryInsights = useMemo(() => getBatteryInsights(battery), [battery])
  const activeBatteryHistory = useMemo(
    () => (batteryPeriod === 'Day' ? batteryHistory.day : batteryPeriod === 'Week' ? batteryHistory.week : batteryHistory.month),
    [batteryHistory.day, batteryHistory.month, batteryHistory.week, batteryPeriod],
  )

  return (
    <main
      className="min-h-screen min-h-dvh w-full overflow-visible bg-[radial-gradient(circle_at_18%_0%,rgba(38,102,222,0.22),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(78,117,219,0.14),transparent_24%),linear-gradient(180deg,#060a11,#05070d_52%,#04060c)] text-dashboard-text"
      data-testid="mobile-dashboard"
      style={
        {
          ['--mobile-nav-height' as string]: '76px',
          ['--mobile-nav-gap' as string]: '12px',
          ['--mobile-bottom-space' as string]: 'calc(var(--mobile-nav-height) + var(--mobile-nav-gap) + env(safe-area-inset-bottom))',
        }
      }
    >
      <div className="relative mx-auto block min-h-screen min-h-dvh w-full max-w-[430px] overflow-visible px-[max(14px,env(safe-area-inset-right))] pb-0 pl-[max(14px,env(safe-area-inset-left))] pr-[max(14px,env(safe-area-inset-right))] pt-[max(14px,env(safe-area-inset-top))]">
        <section
          className="min-h-screen min-h-dvh overflow-visible pb-[var(--mobile-bottom-space)] pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-tab={activeTab}
          data-testid={`mobile-tab-${activeTab}`}
          key={activeTab}
        >
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
              energyDayControls={energyDayControls}
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
              history={activeBatteryHistory}
              insights={batteryInsights}
              optimizer={batteryOptimizer}
              period={batteryPeriod}
              onPeriodChange={setBatteryPeriod}
            />
          ) : null}

          {activeTab === 'ev' ? <MobileEvScreen batterySoc={battery.soc} charger={charger} controller={controller} /> : null}

          {activeTab === 'notifications' ? (
            <MobileNotificationsScreen
              controller={notifications}
              notifications={notifications}
              preferences={notificationPreferences}
              setPreference={onNotificationPreferenceChange}
            />
          ) : null}
        </section>

        <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  )
}
