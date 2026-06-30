import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { cn } from '../../../lib/cn'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import { BatteryDetailsSection, BatteryOptimizerSection } from './DesktopBatterySections'
import { StatusPill } from './DesktopShared'

const BATTERY_SECTIONS = ['Battery details', 'Battery optimizer'] as const
type BatterySection = (typeof BATTERY_SECTIONS)[number]
type BatteryHistoryPeriod = '24h' | '7d' | '30d' | '90d'
type OptimizerSection = 'Status' | 'Plan' | 'Charts'

export function DesktopBatteryPage({
  battery,
  batteryHistory,
  batteryOptimizer,
  displayDate,
  displayTime,
  weather,
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
    month: { labels: string[]; points: number[] }
    quarter: { labels: string[]; points: number[] }
    week: { labels: string[]; points: number[] }
  }
  batteryOptimizer: BatteryOptimizerState
  displayDate: string
  displayTime: string
  weather: {
    condition: string
    temperature: string
  }
}) {
  const [period, setPeriod] = useState<BatteryHistoryPeriod>('24h')
  const [batterySection, setBatterySection] = useState<BatterySection>('Battery details')
  const [optimizerSection, setOptimizerSection] = useState<OptimizerSection>('Status')

  const timeEstimate = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(battery.capacity),
    powerKw: parseDisplayNumber(battery.power),
    socPercent: battery.socValue,
    status: battery.status,
    storedEnergyKwh: parseDisplayNumber(battery.energy),
  })
  return (
    <section
      className="absolute left-[236px] right-0 top-0 h-[941px] overflow-hidden px-8 pb-6 pr-7 pt-6"
      aria-label="Battery details"
    >
      <header className="flex h-[70px] items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Battery</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">
            {batterySection === 'Battery details'
              ? 'Battery status, charge level, and history in one place'
              : 'Battery optimizer workspace for status, planning, and charts'}
          </p>
        </div>
        <div className="fixed left-[1196px] top-[31px] z-[3] grid grid-cols-[126px_146px_142px] gap-6">
          <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
          <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
          <StatusPill primary="All systems" secondary="Normal" tone="ok" />
        </div>
      </header>

      <div className="flex h-[calc(100%-82px)] min-h-0 flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battery sections">
          {BATTERY_SECTIONS.map((item) => (
            <button
              key={item}
              aria-selected={batterySection === item}
              className={cn(
                'inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
                batterySection === item
                  ? 'border-dashboard-blue/45 bg-dashboard-blue/16 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.18)]'
                  : 'border-white/10 bg-white/5 text-dashboard-soft hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text',
              )}
              role="tab"
              type="button"
              onClick={() => setBatterySection(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {batterySection === 'Battery details' ? (
          <BatteryDetailsSection
            battery={battery}
            batteryHistory={batteryHistory}
            period={period}
            setPeriod={setPeriod}
            timeEstimate={timeEstimate}
          />
        ) : (
          <BatteryOptimizerSection optimizer={batteryOptimizer} optimizerSection={optimizerSection} setOptimizerSection={setOptimizerSection} />
        )}
      </div>
    </section>
  )
}
