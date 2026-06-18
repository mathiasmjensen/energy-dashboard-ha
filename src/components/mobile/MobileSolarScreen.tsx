import type { MobileDashboardProps, SolarPeriod } from './MobileTypes'
import {
  AnalyticsCard,
  FlowPath,
  GlassCard,
  MobileBarChart,
  MobileIcon,
  NodeIcon,
  SOLAR_PERIODS,
  SectionHeading,
  SegmentedControl,
} from './MobilePrimitives'

export function MobileSolarScreen({
  distribution,
  overview,
  period,
  prices,
  solarForecast,
  solarProduction,
  onPeriodChange,
}: Pick<MobileDashboardProps, 'distribution' | 'overview' | 'prices' | 'solarForecast' | 'solarProduction'> & {
  period: SolarPeriod
  onPeriodChange: (period: SolarPeriod) => void
}) {
  return (
    <div className="mobile-screen mobile-screen--solar">
      <SegmentedControl
        active={period}
        ariaLabel="Solar analytics period"
        options={SOLAR_PERIODS}
        onChange={(value) => onPeriodChange(value as SolarPeriod)}
      />

      <GlassCard className="mobile-section-card">
        <SectionHeading title="Energy flow" />
        <SolarFlowDiagram distribution={distribution} overview={overview} />
      </GlassCard>

      <AnalyticsCard accent="solar" actionLabel={period} metric={solarProduction.value} title="Solar production" unit="kWh">
        <MobileBarChart
          labels={Array.from({ length: solarProduction.curve.length }, (_, index) => `${index.toString().padStart(2, '0')}:00`)}
          unit="kW"
          values={solarProduction.curve}
        />
      </AnalyticsCard>

      <AnalyticsCard
        accent="solar"
        actionLabel="Tomorrow"
        metric={solarForecast.totalKwh}
        summary={solarForecast.summaryItems}
        title="Solar forecast"
        unit="kWh"
      >
        <MobileBarChart color="#f7b62f" labels={solarForecast.pointLabels} unit="kWh" values={solarForecast.points} />
      </AnalyticsCard>

      <AnalyticsCard
        accent="blue"
        actionLabel="Today"
        metric={prices.primaryValue}
        summary={prices.summaryItems}
        title="Energy prices"
        unit="DKK/kWh"
      >
        <MobileBarChart color="#3b82ff" labels={prices.pointLabels} unit="DKK/kWh" values={prices.points} />
      </AnalyticsCard>
    </div>
  )
}

function SolarFlowDiagram({
  distribution,
  overview,
}: {
  distribution: MobileDashboardProps['distribution']
  overview: MobileDashboardProps['overview']
}) {
  const batteryDirection = overview.batteryMeta.toLowerCase().includes('charging') ? 'forward' : 'reverse'
  const gridDirection = overview.gridMeta.toLowerCase().includes('import') ? 'forward' : 'reverse'
  const evDirection = overview.evMeta.toLowerCase().includes('charg') ? 'forward' : 'reverse'

  return (
    <div className="mobile-solar-flow">
      <div className="mobile-solar-flow__node mobile-solar-flow__node--solar">
        <NodeIcon tone="gold">
          <MobileIcon name="solar" />
        </NodeIcon>
        <span>Solar</span>
        <strong>{distribution.solar} kWh</strong>
      </div>

      <div className="mobile-solar-flow__node mobile-solar-flow__node--grid">
        <NodeIcon tone="blue">
          <MobileIcon name="grid" />
        </NodeIcon>
        <span>Grid</span>
        <strong>{distribution.grid} kWh</strong>
      </div>

      <div className="mobile-solar-flow__hub">
        <NodeIcon tone="white">
          <MobileIcon name="home" />
        </NodeIcon>
        <span>Home</span>
        <strong>{distribution.home} kWh</strong>
      </div>

      <div className="mobile-solar-flow__node mobile-solar-flow__node--battery">
        <NodeIcon tone="green">
          <MobileIcon name="battery" />
        </NodeIcon>
        <span>Battery</span>
        <strong>{distribution.battery} kWh</strong>
      </div>

      <div className="mobile-solar-flow__node mobile-solar-flow__node--ev">
        <NodeIcon tone="neutral">
          <MobileIcon name="car" />
        </NodeIcon>
        <span>EV Charger</span>
        <strong>{distribution.ev} kWh</strong>
      </div>

      <svg className="mobile-solar-flow__lines" viewBox="0 0 320 170" aria-hidden="true">
        <FlowPath color="#f7b62f" direction="forward" path="M74 38 H122 C144 38 150 52 150 72" />
        <FlowPath color="#9a5cff" direction={gridDirection} path="M74 118 H126 C146 118 150 104 150 88" />
        <FlowPath color="#57dd70" direction={batteryDirection} path="M170 72 C174 54 184 40 206 40 H252" />
        <FlowPath color="#707788" direction={evDirection} path="M170 88 C174 108 184 122 206 122 H252" />
      </svg>
    </div>
  )
}
