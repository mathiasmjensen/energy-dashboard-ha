import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import { BatteryDetailsWorkspace, BatteryPlannerDashboard } from './DesktopBatterySections'
import { DesktopPageHeader } from './DesktopPageHeader'

type BatterySection = 'Dashboard' | 'Details'
type BatteryHistoryPeriod = '24h' | '7d' | '30d' | '90d'

export function DesktopBatteryPage({
  battery,
  batteryHistory,
  batteryOptimizer,
  displayDate,
  displayTime,
  weather,
  flow,
  distribution,
  onGoOverview,
  onOpenEvCharger,
  onOpenNotifications,
  onOpenSettings,
}: {
  battery: {
    capacity: string
    energy: string
    power: string
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
  displayDate: string
  displayTime: string
  weather: {
    condition: string
    temperature: string
  }
  flow: {
    evPower: string
    evStatus: string
    gridPower: string
    gridStatus: string
    homePower: string
    solarPower: string
  }
  distribution: {
    batteryCharge: string
    batteryDischarge: string
    gridExport: string
    gridImport: string
  }
  onGoOverview: () => void
  onOpenEvCharger: () => void
  onOpenNotifications: () => void
  onOpenSettings: () => void
}) {
  const [period, setPeriod] = useState<BatteryHistoryPeriod>('24h')
  const [batterySection, setBatterySection] = useState<BatterySection>('Dashboard')

  const timeEstimate = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(battery.capacity),
    powerKw: parseDisplayNumber(battery.power),
    socPercent: battery.socValue,
    status: battery.status,
    storedEnergyKwh: parseDisplayNumber(battery.energy),
  })
  return (
    <section
      className="absolute inset-0 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_50%_0%,rgba(27,47,68,0.22),transparent_35%),#080d14] px-7 pb-6 pt-[94px] [scrollbar-gutter:stable]"
      aria-label="Battery details"
    >
      <DesktopPageHeader
        active="battery"
        displayDate={displayDate}
        displayTime={displayTime}
        onOpenEvCharger={onOpenEvCharger}
        onSelect={(page) => page === 'settings' ? onOpenSettings() : page === 'notifications' ? onOpenNotifications() : page === 'overview' ? onGoOverview() : setBatterySection('Dashboard')}
        subtitle={batterySection === 'Details' ? 'Battery history and the complete optimization schedule' : 'Detailed overview of your battery system and optimization'}
        title="Battery"
        weather={weather}
      />

      <div className="flex min-h-full flex-col gap-4">
        {batterySection === 'Details' ? (
          <>
            <button className="w-fit rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-dashboard-soft transition hover:border-white/20 hover:text-white" type="button" onClick={() => setBatterySection('Dashboard')}>
              Back to battery dashboard
            </button>
            <BatteryDetailsWorkspace
              battery={battery}
              batteryHistory={batteryHistory}
              period={period}
              setPeriod={setPeriod}
              timeEstimate={timeEstimate}
              optimizer={batteryOptimizer}
            />
          </>
        ) : (
          <BatteryPlannerDashboard
            battery={battery}
            batteryHistory={batteryHistory}
            distribution={distribution}
            flow={flow}
            optimizer={batteryOptimizer}
            onOpenDetails={() => setBatterySection('Details')}
          />
        )}
      </div>
    </section>
  )
}
