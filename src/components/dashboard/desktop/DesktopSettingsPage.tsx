import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { cn } from '../../../lib/cn'
import { BatteryOptimizerControlsCard, BatteryOptimizerDecisionSummary, BatteryOptimizerStatusCard, OptimizerStateBanner } from '../../battery/BatteryOptimizerSections'
import { StatusPill } from './DesktopShared'

export function DesktopSettingsPage({
  displayDate,
  displayTime,
  optimizer,
  weather,
  onGoBattery,
  onGoOverview,
  onOpenEvCharger,
}: {
  displayDate: string
  displayTime: string
  optimizer: BatteryOptimizerState
  weather: { condition: string; temperature: string }
  onGoBattery: () => void
  onGoOverview: () => void
  onOpenEvCharger: () => void
}) {
  return (
    <section className="absolute inset-0 overflow-y-auto overscroll-contain px-6 pb-8 pt-5 [scrollbar-gutter:stable]" aria-label="Settings">
      <header className="flex h-[76px] items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Settings</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">Battery automation and optimizer preferences</p>
        </div>
        <nav className="absolute left-1/2 top-[18px] flex -translate-x-1/2 items-center rounded-[18px] border border-white/10 bg-[#090e16]/88 p-1 shadow-[0_16px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl" aria-label="Dashboard sections">
          <SettingsMenuItem label="Overview" onClick={onGoOverview} />
          <SettingsMenuItem label="Solar" onClick={onGoOverview} />
          <SettingsMenuItem label="Battery" onClick={onGoBattery} />
          <SettingsMenuItem label="EV Charger" onClick={onOpenEvCharger} />
          <SettingsMenuItem active label="Settings" onClick={() => undefined} />
        </nav>
        <div className="fixed left-[1196px] top-[31px] z-[3] grid grid-cols-[126px_146px_142px] gap-6">
          <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
          <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
          <StatusPill primary="All systems" secondary="Normal" tone="ok" />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1120px] gap-4 pt-2">
        <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <BatteryOptimizerControlsCard optimizer={optimizer} variant="desktop" />
          <div className="grid gap-4">
            <BatteryOptimizerStatusCard optimizer={optimizer} variant="desktop" />
            <BatteryOptimizerDecisionSummary optimizer={optimizer} variant="desktop" />
          </div>
        </div>
      </div>
    </section>
  )
}

function SettingsMenuItem({ active = false, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
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
