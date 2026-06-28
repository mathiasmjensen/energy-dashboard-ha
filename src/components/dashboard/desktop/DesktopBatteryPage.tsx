import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../hooks/useBatteryOptimizer'
import { cn } from '../../../lib/cn'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import {
  BatteryOptimizerCharts,
  BatteryOptimizerControlsCard,
  BatteryOptimizerDecisionSummary,
  BatteryOptimizerPlanTable,
  BatteryOptimizerStatusCard,
  OptimizerStateBanner,
} from '../../battery/BatteryOptimizerSections'
import { BatteryVisual } from '../../shared/BatteryVisual'
import { LineChart, StatusPill } from './DesktopShared'

const PERIODS = ['24h', '7d', '30d', '90d'] as const
type BatteryHistoryPeriod = (typeof PERIODS)[number]

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

  const timeEstimate = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(battery.capacity),
    powerKw: parseDisplayNumber(battery.power),
    socPercent: battery.socValue,
    status: battery.status,
    storedEnergyKwh: parseDisplayNumber(battery.energy),
  })

  const activeHistory =
    period === '24h'
      ? batteryHistory.day
      : period === '7d'
        ? batteryHistory.week
        : period === '30d'
          ? batteryHistory.month
          : batteryHistory.quarter

  return (
    <section
      className="absolute left-[236px] right-0 top-0 h-[941px] overflow-hidden px-7 pb-6 pr-6 pt-6"
      aria-label="Battery details"
    >
      <header className="flex h-[70px] items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Battery</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">Full-screen battery status, history, and optimizer workspace</p>
        </div>
        <div className="fixed left-[1196px] top-[31px] z-[3] grid grid-cols-[126px_146px_142px] gap-6">
          <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
          <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
          <StatusPill primary="All systems" secondary="Normal" tone="ok" />
        </div>
      </header>

      <div className="grid h-[calc(100%-82px)] grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-5">
        <section className="flex min-h-0 flex-col gap-5 overflow-hidden">
          <div className="grid gap-4 xl:grid-cols-[1fr_220px_1fr]">
            <div className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <strong className="block text-[2.2rem] font-semibold leading-none text-dashboard-text">{battery.soc}</strong>
              <span className="mt-1 block text-sm text-dashboard-soft">State of charge</span>
              <div className="my-4 h-px bg-white/10" />
              <strong className="block text-[1.6rem] font-semibold leading-none text-dashboard-text">{battery.energy} kWh</strong>
              <span className="mt-1 block text-sm text-dashboard-soft">Stored energy</span>
            </div>

            <div className="flex items-center justify-center rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <BatteryVisual level={battery.socValue} size="modal" />
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <strong
                className={cn(
                  'block text-[1.45rem] font-semibold',
                  battery.status.toLowerCase() === 'charging'
                    ? 'text-emerald-300'
                    : battery.status.toLowerCase() === 'discharging'
                      ? 'text-rose-300'
                      : 'text-dashboard-text',
                )}
              >
                {battery.status}
              </strong>
              <strong className="mt-3 block text-[1.85rem] font-semibold leading-none text-dashboard-text">{battery.power} kW</strong>
              <span className="mt-1 block text-sm text-dashboard-soft">{timeEstimate.label}</span>
              <div className="my-4 h-px bg-white/10" />
              <strong className="block text-[1.4rem] font-semibold leading-none text-dashboard-text">{timeEstimate.value}</strong>
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-dashboard-text">Battery % over time</h2>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battery history period">
                {PERIODS.map((item) => (
                  <button
                    key={item}
                    aria-selected={period === item}
                    className={cn(
                      'inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
                      period === item
                        ? 'border-dashboard-blue/45 bg-dashboard-blue/16 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.18)]'
                        : 'border-white/10 bg-white/5 text-dashboard-soft hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text',
                    )}
                    role="tab"
                    type="button"
                    onClick={() => setPeriod(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <LineChart
              className="min-h-[260px] rounded-[18px] border border-white/8 bg-[#0b111d]/88 p-3"
              color="#60ea5d"
              label="Battery percentage over time"
              labels={activeHistory.labels}
              points={activeHistory.points}
              unit="%"
            />

            <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-white/8 bg-[#0b111d]/88 px-4 py-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-dashboard-text">
                i
              </span>
              <p className="text-sm leading-5 text-dashboard-soft">
                The graph shows the battery state of charge over the selected time period.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
          <OptimizerStateBanner optimizer={batteryOptimizer} variant="desktop" />
          <div className="grid gap-4 xl:grid-cols-2">
            <BatteryOptimizerStatusCard optimizer={batteryOptimizer} variant="desktop" />
            <BatteryOptimizerDecisionSummary optimizer={batteryOptimizer} variant="desktop" />
            <BatteryOptimizerControlsCard optimizer={batteryOptimizer} variant="desktop" />
          </div>
          <BatteryOptimizerPlanTable optimizer={batteryOptimizer} planHours={48} variant="desktop" />
          <BatteryOptimizerCharts optimizer={batteryOptimizer} variant="desktop" />
        </section>
      </div>
    </section>
  )
}
