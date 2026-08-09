import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { BatteryOptimizerControlsCard, BatteryOptimizerDecisionSummary, BatteryOptimizerStatusCard, OptimizerStateBanner } from '../../battery/BatteryOptimizerSections'
import { StatusPill } from './DesktopShared'
import { DesktopTopNavigation } from './DesktopTopNavigation'

export function DesktopSettingsPage({
  displayDate,
  displayTime,
  optimizer,
  weather,
  onGoBattery,
  onGoOverview,
  onOpenEvCharger,
  onOpenNotifications,
}: {
  displayDate: string
  displayTime: string
  optimizer: BatteryOptimizerState
  weather: { condition: string; temperature: string }
  onGoBattery: () => void
  onGoOverview: () => void
  onOpenEvCharger: () => void
  onOpenNotifications: () => void
}) {
  return (
    <section className="absolute inset-0 overflow-y-auto overscroll-contain px-6 pb-8 pt-5 [scrollbar-gutter:stable]" aria-label="Settings">
      <header className="flex h-[76px] items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Settings</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">Battery automation and optimizer preferences</p>
        </div>
        <DesktopTopNavigation active="settings" onOpenEvCharger={onOpenEvCharger} onSelect={(page) => page === 'battery' ? onGoBattery() : page === 'notifications' ? onOpenNotifications() : page === 'overview' ? onGoOverview() : undefined} />
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
