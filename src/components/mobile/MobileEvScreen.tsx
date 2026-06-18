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
    <div className="mobile-screen mobile-screen--ev" data-mode={activeMode}>
      <GlassCard className="mobile-vehicle-card">
        <img src={assetPath('/new-energy-dashboard/car.png')} alt="Tesla Model Y" />
        <div className="mobile-vehicle-copy">
          <strong>Tesla Model Y</strong>
          <span>
            <i />
            Connected
          </span>
          <small>Ready to charge</small>
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
        <GlassCard className="mobile-ev-section mobile-ev-section--status">
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
        <GlassCard className="mobile-ev-section mobile-ev-section--plan">
          <EvChargerActivitySection controller={controller} layout="mobile" showTabs={false} />
        </GlassCard>
      ) : null}

      {activeMode === 'history' ? (
        <GlassCard className="mobile-ev-section mobile-ev-section--history">
          <EvChargerActivitySection controller={controller} layout="mobile" showTabs={false} />
        </GlassCard>
      ) : null}

      <div className="mobile-ev-meta">
        <span>Vehicle battery</span>
        <strong>{batterySoc}%</strong>
      </div>
    </div>
  )
}
