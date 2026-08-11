import type { EvChargerController } from '../../../models/evChargePlan'
import { EvChargerActivitySection, EvChargerOverviewSection, EvChargerSettingsSection } from '../../ev/EvChargerContent'
import { DesktopPageHeader } from './DesktopPageHeader'
import type { DesktopPageKey } from './DesktopTopNavigation'

export function DesktopEvChargerPage({
  charger,
  controller,
  displayDate,
  displayTime,
  onSelect,
  weather,
}: {
  charger: {
    chargeRate: string
    sessionDuration: string
    sessionEnergy: string
    status: string
  }
  controller: EvChargerController
  displayDate: string
  displayTime: string
  onSelect: (page: DesktopPageKey) => void
  weather: { condition: string; temperature: string }
}) {
  return (
    <section className="absolute inset-0 overflow-y-auto overscroll-contain px-7 pb-6 pt-[94px] [scrollbar-gutter:stable]" aria-label="EV charger workspace">
      <DesktopPageHeader
        active="ev"
        displayDate={displayDate}
        displayTime={displayTime}
        onSelect={onSelect}
        subtitle="Live charging status, EVCC settings, and price-aware charging plans"
        title="EV Charger"
        weather={weather}
      />

      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <EvChargerOverviewSection
            chargeRate={charger.chargeRate}
            sessionDuration={charger.sessionDuration}
            sessionEnergy={charger.sessionEnergy}
            status={charger.status}
          />
          <EvChargerSettingsSection controller={controller} />
        </div>
        <EvChargerActivitySection controller={controller} />
      </div>
    </section>
  )
}
