import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { cn } from '../../../lib/cn'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import { BatteryDetailsWorkspace, BatteryPlannerDashboard } from './DesktopBatterySections'
import { StatusPill } from './DesktopShared'

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
      className="absolute inset-0 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_50%_0%,rgba(27,47,68,0.22),transparent_35%),#080d14] px-6 pb-8 pt-5 [scrollbar-gutter:stable]"
      aria-label="Battery details"
    >
      <header className="relative mx-auto flex h-[82px] w-full max-w-[1530px] items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Battery</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">
            {batterySection === 'Details'
              ? 'Battery history and the complete optimization schedule'
              : 'Live battery state, energy flow, and the next best decision'}
          </p>
        </div>
        <nav className="absolute left-1/2 top-[9px] flex -translate-x-1/2 items-center rounded-[18px] border border-white/10 bg-[#090e16]/88 p-1 shadow-[0_16px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl" aria-label="Dashboard sections">
          <BatteryPageMenuItem label="Overview" onClick={onGoOverview} />
          <BatteryPageMenuItem label="Solar" onClick={onGoOverview} />
          <BatteryPageMenuItem active label="Battery" onClick={() => setBatterySection('Dashboard')} />
          <BatteryPageMenuItem label="EV Charger" onClick={onOpenEvCharger} />
          <BatteryPageMenuItem label="Settings" onClick={onOpenSettings} />
        </nav>
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

function BatteryPageMenuItem({ active = false, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={cn(
        'min-w-[78px] rounded-[13px] px-3 py-2 text-[12px] font-semibold transition',
        active ? 'bg-dashboard-green/15 text-dashboard-green shadow-[inset_0_0_0_1px_rgba(96,234,93,0.35)]' : 'text-dashboard-soft hover:bg-white/[0.06] hover:text-white',
      )}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}
