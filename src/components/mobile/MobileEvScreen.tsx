import { useState } from 'react'
import type { MobileDashboardProps } from './MobileTypes'
import { assetPath } from '../../utils/assetPath'
import { EvChargerActivitySection, EvChargerOverviewSection, EvChargerSettingsSection } from '../ev/EvChargerContent'
import { GlassCard, SectionHeading, SegmentedControl } from './MobilePrimitives'

type MobileEvMode = 'history' | 'plan' | 'status'

const EV_MODE_OPTIONS: MobileEvMode[] = ['status', 'plan', 'history']
const EV_MODE_LABELS: Record<MobileEvMode, string> = {
  history: 'History',
  plan: 'Plan',
  status: 'Status',
}

export function MobileEvScreen({
  batterySoc,
  charger,
  controller,
}: {
  batterySoc: string
  charger: MobileDashboardProps['charger']
  controller: MobileDashboardProps['controller']
}) {
  const [activeMode, setActiveMode] = useState<MobileEvMode>('status')

  const handleModeChange = (value: string) => {
    const nextMode = value as MobileEvMode
    setActiveMode(nextMode)

    if (nextMode === 'plan' || nextMode === 'history') {
      controller.setBottomMode(nextMode)
    }
  }

  return (
    <div className="flex flex-col gap-4" data-mode={activeMode}>
      <GlassCard className="grid grid-cols-[128px_1fr] gap-4 rounded-[24px] p-4">
        <img src={assetPath('/new-energy-dashboard/car.png')} alt="Tesla Model Y" />
        <div className="grid content-center gap-2">
          <strong className="text-xl font-semibold text-dashboard-text">Tesla Model Y</strong>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-dashboard-soft">
            <i className="h-2.5 w-2.5 rounded-full bg-dashboard-green shadow-[0_0_14px_rgba(96,234,93,0.52)]" />
            Connected
          </span>
          <small className="text-sm text-dashboard-soft">Ready to charge</small>
        </div>
      </GlassCard>

      <SegmentedControl
        active={activeMode}
        ariaLabel="EV screen mode"
        options={EV_MODE_OPTIONS}
        optionLabels={EV_MODE_LABELS}
        onChange={handleModeChange}
      />

      {activeMode === 'status' ? (
        <GlassCard className="flex flex-col gap-4 rounded-[24px] p-4">
          <SectionHeading title="Charger status" />
          <EvChargerOverviewSection
            chargeRate={charger.chargeRate}
            layout="mobile"
            sessionDuration={charger.sessionDuration}
            sessionEnergy={charger.sessionEnergy}
            status={charger.status}
          />
          <EvChargerSettingsSection controller={controller} />
        </GlassCard>
      ) : null}

      {activeMode === 'plan' ? (
        <GlassCard className="rounded-[24px] p-0">
          <EvChargerActivitySection controller={controller} layout="mobile" showTabs={false} />
        </GlassCard>
      ) : null}

      {activeMode === 'history' ? (
        <GlassCard className="rounded-[24px] p-0">
          <EvChargerActivitySection controller={controller} layout="mobile" showTabs={false} />
        </GlassCard>
      ) : null}

      <div className="flex items-center justify-between px-1 text-sm text-dashboard-soft">
        <span>Vehicle battery</span>
        <strong className="text-base font-semibold text-dashboard-text">{batterySoc}%</strong>
      </div>
    </div>
  )
}
