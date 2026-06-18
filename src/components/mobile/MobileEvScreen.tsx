import type { MobileDashboardProps } from './MobileTypes'
import { assetPath } from '../../utils/assetPath'
import { EvChargerActivitySection, EvChargerOverviewSection, EvChargerSettingsSection } from '../ev/EvChargerContent'
import { GlassCard, SectionHeading, SegmentedControl } from './MobilePrimitives'

export function MobileEvScreen({
  batterySoc,
  charger,
  controller,
}: {
  batterySoc: string
  charger: MobileDashboardProps['charger']
  controller: MobileDashboardProps['controller']
}) {
  return (
    <div className="mobile-screen mobile-screen--ev">
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
        active={controller.bottomMode}
        ariaLabel="EV screen mode"
        options={['plan', 'history']}
        optionLabels={{ history: 'History', plan: 'Plan' }}
        onChange={(value) => controller.setBottomMode(value as 'history' | 'plan')}
      />

      {controller.bottomMode === 'plan' ? (
        <>
          <GlassCard className="mobile-ev-section">
            <SectionHeading title="Charger status" />
            <EvChargerOverviewSection
              chargeRate={charger.chargeRate}
              layout="mobile"
              sessionDuration={charger.sessionDuration}
              sessionEnergy={charger.sessionEnergy}
              status={charger.status}
            />
          </GlassCard>

          <GlassCard className="mobile-ev-section">
            <EvChargerSettingsSection controller={controller} />
          </GlassCard>

          <GlassCard className="mobile-ev-section">
            <EvChargerActivitySection controller={controller} layout="mobile" showTabs={false} />
          </GlassCard>
        </>
      ) : (
        <GlassCard className="mobile-ev-section mobile-ev-section--history">
          <EvChargerActivitySection controller={controller} layout="mobile" showTabs={false} />
        </GlassCard>
      )}

      <div className="mobile-ev-meta">
        <span>Vehicle battery</span>
        <strong>{batterySoc}%</strong>
      </div>
    </div>
  )
}
