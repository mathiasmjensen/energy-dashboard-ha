import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import { BatteryDetailsWorkspace, BatteryPlannerDashboard } from './DesktopBatterySections'
import { StatusPill } from './DesktopShared'
import { DesktopTopNavigation } from './DesktopTopNavigation'

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
      className="absolute inset-0 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_50%_0%,rgba(27,47,68,0.22),transparent_35%),#080d14] px-5 pb-8 pt-5 [scrollbar-gutter:stable]"
      aria-label="Battery details"
    >
      <header className="relative flex h-[89px] w-full items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Battery</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">
            {batterySection === 'Details'
              ? 'Battery history and the complete optimization schedule'
              : 'Detailed overview of your battery system and optimization'}
          </p>
        </div>
        <DesktopTopNavigation active="battery" onOpenEvCharger={onOpenEvCharger} onSelect={(page) => page === 'settings' ? onOpenSettings() : page === 'notifications' ? onOpenNotifications() : page === 'overview' ? onGoOverview() : setBatterySection('Dashboard')} />
        <div className="absolute right-0 top-[7px] z-[3] grid grid-cols-[104px_126px_126px] gap-4">
          <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
          <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
          <StatusPill primary="All systems" secondary="Normal" tone="ok" />
        </div>
      </header>

      <div className="flex min-h-[calc(100%-82px)] flex-col gap-4">
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
