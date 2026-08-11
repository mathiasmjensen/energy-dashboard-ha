import type { BatteryOptimizerState } from '../../../models/batteryOptimizer'
import { BatteryOptimizerControlsCard, BatteryOptimizerDecisionSummary, BatteryOptimizerStatusCard, OptimizerStateBanner } from '../../battery/BatteryOptimizerSections'
import { DesktopPageHeader } from './DesktopPageHeader'

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
    <section className="absolute inset-0 overflow-y-auto overscroll-contain px-7 pb-6 pt-[94px] [scrollbar-gutter:stable]" aria-label="Settings">
      <DesktopPageHeader
        active="settings"
        displayDate={displayDate}
        displayTime={displayTime}
        onOpenEvCharger={onOpenEvCharger}
        onSelect={(page) => page === 'battery' ? onGoBattery() : page === 'notifications' ? onOpenNotifications() : page === 'overview' ? onGoOverview() : undefined}
        subtitle="Battery automation and optimizer preferences"
        title="Settings"
        weather={weather}
      />

      <div className="grid w-full gap-4">
        <OptimizerStateBanner optimizer={optimizer} variant="desktop" />
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
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
