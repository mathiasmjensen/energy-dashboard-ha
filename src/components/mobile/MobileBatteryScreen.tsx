import { useState } from 'react'
import type { BatteryOptimizerState } from '../../models/batteryOptimizer'
import type { BatteryPeriod, MobileDashboardProps } from './MobileTypes'
import { MobileBatteryDetailsSection, MobileBatteryOptimizerSection } from './MobileBatterySections'
import { SegmentedControl } from './MobilePrimitives'

const MOBILE_BATTERY_SECTIONS = ['Details', 'Optimizer'] as const
type MobileBatterySection = (typeof MOBILE_BATTERY_SECTIONS)[number]
type MobileOptimizerSection = 'status' | 'plan' | 'charts'

export function MobileBatteryScreen({
  battery,
  history,
  insights,
  optimizer,
  period,
  onPeriodChange,
}: {
  battery: MobileDashboardProps['battery']
  history: { labels: string[]; points: number[] }
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
  const [section, setSection] = useState<MobileBatterySection>('Details')
  const [optimizerSection, setOptimizerSection] = useState<MobileOptimizerSection>('status')

  return (
    <div className="flex flex-col gap-4 pb-2">
      <SegmentedControl active={section} ariaLabel="Battery mobile section" options={MOBILE_BATTERY_SECTIONS} onChange={(value) => setSection(value as MobileBatterySection)} />

      {section === 'Details' ? (
        <MobileBatteryDetailsSection battery={battery} history={history} insights={insights} period={period} onPeriodChange={onPeriodChange} />
      ) : (
        <MobileBatteryOptimizerSection optimizer={optimizer} optimizerSection={optimizerSection} setOptimizerSection={setOptimizerSection} />
      )}
    </div>
  )
}
