import { useState } from 'react'
import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
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
const OPTIMIZER_SECTIONS = ['Status', 'Plan', 'Charts'] as const
type OptimizerSection = (typeof OPTIMIZER_SECTIONS)[number]

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
  const [optimizerSection, setOptimizerSection] = useState<OptimizerSection>('Status')

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
      className="absolute left-[236px] right-0 top-0 h-[941px] overflow-hidden px-8 pb-6 pr-7 pt-6"
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

      <div className="grid h-[calc(100%-82px)] grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-6">
        <section className="flex min-h-0 flex-col gap-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Battery state</span>
                <strong className="mt-3 block text-[2.1rem] font-semibold leading-none text-dashboard-text">{battery.soc}</strong>
                <span className="mt-1.5 block text-sm text-dashboard-soft">State of charge</span>
                <div className="my-4 h-px bg-white/10" />
                <strong className="block text-[1.6rem] font-semibold leading-none text-dashboard-text">{battery.energy} kWh</strong>
                <span className="mt-1.5 block text-sm text-dashboard-soft">Stored energy</span>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Current behavior</span>
                <strong
                  className={cn(
                    'mt-3 block text-[1.4rem] font-semibold',
                    battery.status.toLowerCase() === 'charging'
                      ? 'text-emerald-300'
                      : battery.status.toLowerCase() === 'discharging'
                        ? 'text-rose-300'
                        : 'text-dashboard-text',
                  )}
                >
                  {battery.status}
                </strong>
                <strong className="mt-3 block text-[1.8rem] font-semibold leading-none text-dashboard-text">{battery.power} kW</strong>
                <span className="mt-1.5 block text-sm text-dashboard-soft">{timeEstimate.label}</span>
                <div className="my-4 h-px bg-white/10" />
                <strong className="block text-[1.25rem] font-semibold leading-none text-dashboard-text">{timeEstimate.value}</strong>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <BatteryVisual level={battery.socValue} size="modal" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-dashboard-text">Battery % over time</h2>
                <p className="text-sm text-dashboard-soft">State of charge history for the selected window.</p>
              </div>
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
              className="insight-line-chart min-h-[240px] flex-1 rounded-[20px] border border-white/8 bg-[#0b111d]/88 p-4"
              color="#60ea5d"
              label="Battery percentage over time"
              labels={activeHistory.labels}
              points={activeHistory.points}
              unit="%"
            />

            <div className="mt-3 flex items-start gap-3 rounded-[20px] border border-white/8 bg-[#0b111d]/88 px-4 py-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-dashboard-text">
                i
              </span>
              <p className="text-sm leading-5 text-dashboard-soft">
                The graph shows the battery state of charge over the selected time period.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <OptimizerStateBanner optimizer={batteryOptimizer} variant="desktop" />
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Battery optimizer sections">
            {OPTIMIZER_SECTIONS.map((item) => (
              <button
                key={item}
                aria-selected={optimizerSection === item}
                className={cn(
                  'inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
                  optimizerSection === item
                    ? 'border-dashboard-blue/45 bg-dashboard-blue/16 text-dashboard-text shadow-[0_10px_24px_rgba(77,122,255,0.18)]'
                    : 'border-white/10 bg-white/5 text-dashboard-soft hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text',
                )}
                role="tab"
                type="button"
                onClick={() => setOptimizerSection(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {optimizerSection === 'Status' ? (
              <div className="grid h-full gap-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <BatteryOptimizerStatusCard optimizer={batteryOptimizer} variant="desktop" />
                  <BatteryOptimizerDecisionSummary optimizer={batteryOptimizer} variant="desktop" />
                </div>
                <BatteryOptimizerControlsCard optimizer={batteryOptimizer} variant="desktop" />
              </div>
            ) : optimizerSection === 'Plan' ? (
              <BatteryOptimizerPlanTable optimizer={batteryOptimizer} planHours={48} variant="desktop" />
            ) : (
              <BatteryOptimizerCharts optimizer={batteryOptimizer} variant="desktop" />
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
