import type { PointerEvent } from 'react'
import type { BatteryOptimizerState } from '../hooks/useBatteryOptimizer'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '../lib/cn'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../services/batteryMetrics'
import { BatteryVisual } from './shared/BatteryVisual'
import {
  BatteryOptimizerCharts,
  BatteryOptimizerControlsCard,
  BatteryOptimizerDecisionSummary,
  BatteryOptimizerPlanTable,
  BatteryOptimizerStatusCard,
  OptimizerStateBanner,
} from './battery/BatteryOptimizerSections'
import { LineChart } from './dashboard/desktop/DesktopShared'
import { EvUiIcon } from './ev/EvChargerContent'

const PERIODS = ['24h', '7d', '30d', '90d'] as const
type BatteryHistoryPeriod = (typeof PERIODS)[number]

type BatteryStatusModalProps = {
  capacity: string
  energy: string
  history: {
    day: { labels: string[]; points: number[] }
    month: { labels: string[]; points: number[] }
    quarter: { labels: string[]; points: number[] }
    week: { labels: string[]; points: number[] }
  }
  onClose: () => void
  optimizer: BatteryOptimizerState
  power: string
  soc: string
  socValue: number
  status: string
}

export function BatteryStatusModal({
  capacity,
  energy,
  history,
  onClose,
  optimizer,
  power,
  soc,
  socValue,
  status,
}: BatteryStatusModalProps) {
  const [period, setPeriod] = useState<BatteryHistoryPeriod>('24h')

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const timeEstimate = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(capacity),
    powerKw: parseDisplayNumber(power),
    socPercent: socValue,
    status,
    storedEnergyKwh: parseDisplayNumber(energy),
  })
  const activeHistory = period === '24h' ? history.day : period === '7d' ? history.week : period === '30d' ? history.month : history.quarter

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(4,8,18,0.82)] px-4 py-6 backdrop-blur-xl"
      onPointerDown={handleBackdropPointerDown}
    >
      <section
        className="flex max-h-[min(92vh,1120px)] w-full max-w-[1180px] flex-col gap-5 overflow-y-auto rounded-[28px] border border-white/10 bg-[#0d131d]/96 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="battery-modal-title"
      >
        <header className="flex items-center justify-between gap-4">
          <h2 id="battery-modal-title" className="text-[1.55rem] font-semibold tracking-tight text-dashboard-text">Battery status</h2>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-dashboard-soft transition hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text"
            type="button"
            aria-label="Close battery details"
            onClick={onClose}
          >
            <EvUiIcon name="close" />
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px_1fr]">
          <div className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <strong className="block text-[2.2rem] font-semibold leading-none text-dashboard-text">{soc}</strong>
            <span className="mt-1 block text-sm text-dashboard-soft">State of charge</span>
            <div className="my-4 h-px bg-white/10" />
            <strong className="block text-[1.6rem] font-semibold leading-none text-dashboard-text">{energy} kWh</strong>
            <span className="mt-1 block text-sm text-dashboard-soft">Stored energy</span>
          </div>

          <div className="flex items-center justify-center rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <BatteryVisual level={socValue} size="modal" />
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <strong
              className={cn(
                'block text-[1.45rem] font-semibold',
                status.toLowerCase() === 'charging'
                  ? 'text-emerald-300'
                  : status.toLowerCase() === 'discharging'
                    ? 'text-rose-300'
                    : 'text-dashboard-text',
              )}
            >
              {status}
            </strong>
            <strong className="mt-3 block text-[1.85rem] font-semibold leading-none text-dashboard-text">{power} kW</strong>
            <span className="mt-1 block text-sm text-dashboard-soft">{timeEstimate.label}</span>
            <div className="my-4 h-px bg-white/10" />
            <strong className="block text-[1.4rem] font-semibold leading-none text-dashboard-text">{timeEstimate.value}</strong>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-[#111722]/92 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-dashboard-text">Battery % over time</h3>
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
            <p className="text-sm leading-5 text-dashboard-soft">The graph shows the battery state of charge over the selected time period.</p>
          </div>
        </div>

        <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
        <div className="grid gap-4 xl:grid-cols-2">
          <BatteryOptimizerStatusCard optimizer={optimizer} variant="desktop" />
          <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="desktop" />
          <BatteryOptimizerControlsCard optimizer={optimizer} variant="desktop" />
        </div>
        <BatteryOptimizerPlanTable optimizer={optimizer} planHours={48} variant="desktop" />
        <BatteryOptimizerCharts optimizer={optimizer} variant="desktop" />
      </section>
    </div>
  )
}
