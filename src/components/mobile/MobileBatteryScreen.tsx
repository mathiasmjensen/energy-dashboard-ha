import { useState } from 'react'
import type { BatteryOptimizerState } from '../../models/batteryOptimizer'
import type { BatteryPeriod, MobileDashboardProps } from './MobileTypes'
import { MobileBatteryDetailsSection, MobileBatteryOptimizerSection } from './MobileBatterySections'
import { SegmentedControl } from './MobilePrimitives'

const MOBILE_BATTERY_SECTIONS = ['Planner', 'Details'] as const
type MobileBatterySection = (typeof MOBILE_BATTERY_SECTIONS)[number]
type MobileOptimizerSection = 'status' | 'plan' | 'charts'

export function MobileBatteryScreen({
  battery,
  history,
  historyError,
  historySource,
  insights,
  optimizer,
  period,
  onPeriodChange,
}: {
  battery: MobileDashboardProps['battery']
  history: { labels: string[]; points: number[] }
  historyError: string | null
  historySource: 'ha' | 'unavailable'
  insights: {
    chargeRate: string
    dischargeRate: string
    runtimeLabel: string
    runtimeValue: string
  }
  optimizer: BatteryOptimizerState
  period: BatteryPeriod
  onPeriodChange: (period: BatteryPeriod) => void
}) {
  const [section, setSection] = useState<MobileBatterySection>('Planner')
  const [optimizerSection, setOptimizerSection] = useState<MobileOptimizerSection>('plan')

  return (
    <div className="flex flex-col gap-4 pb-[calc(var(--mobile-bottom-space)+8px)]">
      <SegmentedControl active={section} ariaLabel="Battery mobile section" options={MOBILE_BATTERY_SECTIONS} onChange={(value) => setSection(value as MobileBatterySection)} />

      {section === 'Details' ? (
        <MobileBatteryDetailsSection
          battery={battery}
          history={history}
          historyError={historyError}
          historySource={historySource}
          insights={insights}
          period={period}
          onPeriodChange={onPeriodChange}
        />
      ) : (
        <MobileBatteryOptimizerSection optimizer={optimizer} optimizerSection={optimizerSection} setOptimizerSection={setOptimizerSection} />
      )}
    </div>
  )
}
