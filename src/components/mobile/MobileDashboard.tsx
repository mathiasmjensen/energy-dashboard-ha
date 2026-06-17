import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { EvChargerController } from '../../hooks/useEvChargerController'
import { assetPath } from '../../utils/assetPath'
import {
  EvChargerActivitySection,
  EvChargerOverviewSection,
  EvChargerSettingsSection,
} from '../ev/EvChargerContent'

type InsightItem = {
  label: string
  value: string
}

type InsightChart = {
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  summaryItems: InsightItem[]
  totalKwh?: string
  primaryValue?: string
  windowLabel: string
}

type MobileTab = 'battery' | 'ev' | 'home' | 'solar'
type SolarPeriod = 'Day' | 'Month' | 'Week' | 'Year'
type BatteryPeriod = 'Day' | 'Month' | 'Week'

type MobileDashboardProps = {
  battery: {
    energy: string
    power: string
    soc: string
    socValue: number
    status: string
  }
  charger: {
    chargeRate: string
    sessionDuration: string
    sessionEnergy: string
    status: string
  }
  controller: EvChargerController
  displayDate: string
  displayTime: string
  distribution: {
    battery: string
    ev: string
    grid: string
    home: string
    solar: string
  }
  overview: {
    batteryMeta: string
    batteryPower: string
    evMeta: string
    evPower: string
    gridMeta: string
    gridPower: string
    homePower: string
    solarPower: string
  }
  prices: InsightChart & { primaryValue: string }
  solarForecast: InsightChart & { totalKwh: string }
  solarProduction: {
    curve: number[]
    value: string
  }
}

const MOBILE_TABS: Array<{ icon: MobileIconName; key: MobileTab; label: string; title: string }> = [
  { icon: 'home', key: 'home', label: 'Home', title: 'Home' },
  { icon: 'solar', key: 'solar', label: 'Solar', title: 'Solar' },
  { icon: 'battery', key: 'battery', label: 'Battery', title: 'Battery' },
  { icon: 'car', key: 'ev', label: 'EV', title: 'EV Charger' },
]

const SOLAR_PERIODS: SolarPeriod[] = ['Day', 'Week', 'Month', 'Year']
const BATTERY_PERIODS: BatteryPeriod[] = ['Day', 'Week', 'Month']

export function MobileDashboard({
  battery,
  charger,
  controller,
  displayDate,
  displayTime,
  distribution,
  overview,
  prices,
  solarForecast,
  solarProduction,
}: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('home')
  const [solarPeriod, setSolarPeriod] = useState<SolarPeriod>('Day')
  const [batteryPeriod, setBatteryPeriod] = useState<BatteryPeriod>('Day')
  const activeScreen = MOBILE_TABS.find((tab) => tab.key === activeTab) ?? MOBILE_TABS[0]
  const batteryInsights = useMemo(() => getBatteryInsights(battery), [battery])
  const batteryHistory = useMemo(() => getBatteryHistorySeries(battery.socValue, batteryPeriod), [battery.socValue, batteryPeriod])

  return (
    <main className="mobile-dashboard" data-testid="mobile-dashboard">
      <div className="mobile-app-shell">
        <MobileStatusBar displayTime={displayTime} />
        <MobileTopBar title={activeScreen.title} />

        <section
          className="mobile-tab-panel"
          data-tab={activeTab}
          data-testid={`mobile-tab-${activeTab}`}
          key={activeTab}
        >
          {activeTab === 'home' ? (
            <MobileHomeScreen
              battery={battery}
              displayDate={displayDate}
              displayTime={displayTime}
              overview={overview}
              prices={prices}
              solarForecast={solarForecast}
            />
          ) : null}

          {activeTab === 'solar' ? (
            <MobileSolarScreen
              distribution={distribution}
              overview={overview}
              period={solarPeriod}
              prices={prices}
              solarForecast={solarForecast}
              solarProduction={solarProduction}
              onPeriodChange={setSolarPeriod}
            />
          ) : null}

          {activeTab === 'battery' ? (
            <MobileBatteryScreen
              battery={battery}
              history={batteryHistory}
              insights={batteryInsights}
              period={batteryPeriod}
              onPeriodChange={setBatteryPeriod}
            />
          ) : null}

          {activeTab === 'ev' ? (
            <MobileEvScreen batterySoc={battery.soc} charger={charger} controller={controller} />
          ) : null}
        </section>

        <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  )
}

function MobileHomeScreen({
  battery,
  displayDate,
  displayTime,
  overview,
  prices,
  solarForecast,
}: Pick<MobileDashboardProps, 'battery' | 'displayDate' | 'displayTime' | 'overview' | 'prices' | 'solarForecast'>) {
  return (
    <div className="mobile-screen mobile-screen--home">
      <div className="mobile-meta-row">
        <StatusChip tone="green">Normal</StatusChip>
        <StatusChip tone="gold">
          <MobileIcon name="sun" />
          12.4 C
        </StatusChip>
        <StatusChip tone="neutral">
          <MobileIcon name="refresh" />
          {displayTime}
        </StatusChip>
      </div>

      <HomeHero battery={battery} overview={overview} />

      <div className="mobile-kpi-row" aria-label="Quick system status">
        <KpiPill icon="solar" label="PV" tone="green" value={`${overview.solarPower} kW`} />
        <KpiPill icon="sun" label="Solar" tone="gold" value={`${overview.solarPower} kW`} />
        <KpiPill icon="grid" label={overview.gridMeta} tone="blue" value={`${overview.gridPower} kW`} />
        <KpiPill icon="battery" label={battery.status} tone="green" value={`${overview.batteryPower} kW`} />
        <KpiPill icon="home" label="Home" tone="purple" value={`${overview.homePower} kW`} />
      </div>

      <AnalyticsCard
        accent="solar"
        actionLabel="Tomorrow"
        metric={solarForecast.totalKwh}
        summary={solarForecast.summaryItems}
        title="Solar forecast"
        unit="kWh"
      >
        <MobileLineChart color="#f7b62f" labels={solarForecast.pointLabels} points={solarForecast.points} unit="kWh" />
      </AnalyticsCard>

      <AnalyticsCard
        accent="blue"
        actionLabel="Today"
        metric={prices.primaryValue}
        summary={prices.summaryItems}
        title="Energy prices"
        unit="DKK/kWh"
      >
        <MobileLineChart color="#3b82ff" labels={prices.pointLabels} points={prices.points} unit="DKK/kWh" />
      </AnalyticsCard>

      <div className="mobile-footnote">Last updated {displayDate}</div>
    </div>
  )
}

function MobileSolarScreen({
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
        <MobileLineChart color="#f7b62f" labels={solarForecast.pointLabels} points={solarForecast.points} unit="kWh" />
      </AnalyticsCard>

      <AnalyticsCard
        accent="blue"
        actionLabel="Today"
        metric={prices.primaryValue}
        summary={prices.summaryItems}
        title="Energy prices"
        unit="DKK/kWh"
      >
        <MobileLineChart color="#3b82ff" labels={prices.pointLabels} points={prices.points} unit="DKK/kWh" />
      </AnalyticsCard>
    </div>
  )
}

function MobileBatteryScreen({
  battery,
  history,
  insights,
  period,
  onPeriodChange,
}: {
  battery: MobileDashboardProps['battery']
  history: { labels: string[]; points: number[] }
  insights: ReturnType<typeof getBatteryInsights>
  period: BatteryPeriod
  onPeriodChange: (period: BatteryPeriod) => void
}) {
  return (
    <div className="mobile-screen mobile-screen--battery">
      <GlassCard className="mobile-battery-hero-card">
        <div className="mobile-battery-hero-copy">
          <span>State of charge</span>
          <strong>{battery.soc}%</strong>
          <StatusChip tone={battery.status === 'Charging' ? 'green' : battery.status === 'Discharging' ? 'danger' : 'neutral'}>
            {battery.status}
          </StatusChip>
          <div className="mobile-battery-hero-metric">
            <small>Power</small>
            <strong>{battery.power} kW</strong>
          </div>
        </div>

        <div className="mobile-battery-hero-visual">
          <div className="large-battery" style={{ '--battery-level': `${battery.socValue}%` } as CSSProperties}>
            <i />
          </div>
        </div>
      </GlassCard>

      <div className="mobile-battery-metrics">
        <SmallMetricCard label="Stored energy" value={`${battery.energy} kWh`} />
        <SmallMetricCard label="Charge rate" value={`${insights.chargeRate} kW`} />
        <SmallMetricCard label="Discharge rate" value={`${insights.dischargeRate} kW`} />
        <SmallMetricCard label={insights.runtimeLabel} value={insights.runtimeValue} />
      </div>

      <GlassCard className="mobile-section-card">
        <div className="mobile-card-stack">
          <SectionHeading title="Battery history" />
          <SegmentedControl
            active={period}
            ariaLabel="Battery history period"
            options={BATTERY_PERIODS}
            onChange={(value) => onPeriodChange(value as BatteryPeriod)}
          />
        </div>

        <MobileLineChart color="#4fd55f" labels={history.labels} points={history.points} unit="%" />
      </GlassCard>
    </div>
  )
}

function MobileEvScreen({
  batterySoc,
  charger,
  controller,
}: {
  batterySoc: string
  charger: MobileDashboardProps['charger']
  controller: EvChargerController
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

function MobileStatusBar({ displayTime }: { displayTime: string }) {
  return (
    <div className="mobile-status-bar" aria-hidden="true">
      <span>{displayTime}</span>
      <div>
        <i className="mobile-signal-bars" />
        <i className="mobile-wifi-icon" />
        <i className="mobile-battery-icon" />
      </div>
    </div>
  )
}

function MobileTopBar({ title }: { title: string }) {
  return (
    <header className="mobile-top-bar">
      <button aria-label="Open menu" className="mobile-icon-button" type="button">
        <MobileIcon name="menu" />
      </button>
      <div className="mobile-top-bar__title">
        <h1>{title}</h1>
      </div>
      <button aria-label="Open notifications" className="mobile-icon-button mobile-icon-button--bell" type="button">
        <MobileIcon name="bell" />
      </button>
    </header>
  )
}

function MobileBottomNav({
  activeTab,
  onChange,
}: {
  activeTab: MobileTab
  onChange: (tab: MobileTab) => void
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile dashboard navigation">
      {MOBILE_TABS.map((tab) => (
        <button
          aria-current={tab.key === activeTab ? 'page' : undefined}
          className="mobile-bottom-nav__item"
          data-active={tab.key === activeTab}
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
        >
          <MobileIcon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

function HomeHero({
  battery,
  overview,
}: {
  battery: MobileDashboardProps['battery']
  overview: MobileDashboardProps['overview']
}) {
  return (
    <div className="mobile-home-hero">
      <img src={assetPath('/mobile-dashboard/image.png')} alt="Luxury home with solar roof, battery, EV charger, and Tesla" />
      <HeroFlowLines batteryStatus={battery.status} evStatus={overview.evMeta} gridStatus={overview.gridMeta} />

      <FloatingLabel className="mobile-float-card mobile-float-card--solar" label="Solar production" tone="gold" value={`${overview.solarPower} kW`} />
      <FloatingLabel
        className="mobile-float-card mobile-float-card--grid"
        label="Grid import/export"
        meta={overview.gridMeta}
        tone="blue"
        value={`${overview.gridPower} kW`}
      />
      <FloatingLabel className="mobile-float-card mobile-float-card--home" label="Home consumption" tone="purple" value={`${overview.homePower} kW`} />
      <FloatingLabel
        className="mobile-float-card mobile-float-card--battery"
        label="Battery charge"
        meta={battery.status}
        tone="green"
        value={`${overview.batteryPower} kW`}
      />
      <FloatingLabel
        className="mobile-float-card mobile-float-card--ev"
        label="EV charging"
        meta={overview.evMeta}
        tone="neutral"
        value={`${overview.evPower} kW`}
      />
    </div>
  )
}

function HeroFlowLines({
  batteryStatus,
  evStatus,
  gridStatus,
}: {
  batteryStatus: string
  evStatus: string
  gridStatus: string
}) {
  return (
    <svg className="mobile-hero-lines" viewBox="0 0 360 370" aria-hidden="true">
      <FlowPath
        color="#f7b62f"
        dash="7 26"
        direction="forward"
        path="M72 260 C110 240 130 222 155 200"
      />
      <FlowPath
        color="#5f8fff"
        dash="7 22"
        direction={gridStatus.toLowerCase().includes('import') ? 'forward' : 'reverse'}
        path="M60 300 C108 300 126 296 156 212"
      />
      <FlowPath
        color="#57dd70"
        dash="7 24"
        direction={batteryStatus === 'Charging' ? 'forward' : 'reverse'}
        path="M180 185 C228 182 256 188 286 230"
      />
      <FlowPath
        color="#57dd70"
        dash="7 22"
        direction={batteryStatus === 'Charging' ? 'forward' : 'reverse'}
        path="M182 183 C232 150 268 112 306 92"
      />
      <FlowPath
        color="#7b8aa3"
        dash="6 22"
        direction={evStatus.toLowerCase().includes('charg') ? 'forward' : 'reverse'}
        path="M182 188 C230 212 258 246 300 288"
      />
    </svg>
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

function FlowPath({
  color,
  dash = '6 24',
  direction,
  path,
}: {
  color: string
  dash?: string
  direction: 'forward' | 'reverse'
  path: string
}) {
  return (
    <g className="mobile-flow-path" data-direction={direction} style={{ '--flow-color': color, '--flow-dash': dash } as CSSProperties}>
      <path className="mobile-flow-path__track" d={path} />
      <path className="mobile-flow-path__pulse" d={path} />
    </g>
  )
}

function FloatingLabel({
  className,
  label,
  meta,
  tone,
  value,
}: {
  className: string
  label: string
  meta?: string
  tone: 'blue' | 'gold' | 'green' | 'neutral' | 'purple'
  value: string
}) {
  return (
    <div className={className} data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      {meta ? <small>{meta}</small> : null}
    </div>
  )
}

function AnalyticsCard({
  accent,
  actionLabel,
  children,
  metric,
  summary,
  title,
  unit,
}: {
  accent: 'blue' | 'solar'
  actionLabel: string
  children: ReactNode
  metric: string
  summary?: InsightItem[]
  title: string
  unit: string
}) {
  return (
    <GlassCard className="mobile-analytics-card" data-accent={accent}>
      <div className="mobile-card-header">
        <h2>{title}</h2>
        <button className="mobile-card-action" type="button">
          {actionLabel}
          <MobileIcon name="chevronDown" />
        </button>
      </div>

      <div className="mobile-card-metric">
        <strong>
          {metric}
          <small>{unit}</small>
        </strong>
      </div>

      {summary?.length ? (
        <div className="mobile-card-summary">
          {summary.slice(0, 3).map((item) => (
            <div className="mobile-card-summary__item" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mobile-chart-shell">{children}</div>
    </GlassCard>
  )
}

function SmallMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="mobile-small-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </GlassCard>
  )
}

function GlassCard({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`mobile-glass-card ${className}`.trim()} {...props}>
      {children}
    </section>
  )
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="mobile-section-heading">{title}</h2>
}

function SegmentedControl({
  active,
  ariaLabel,
  optionLabels,
  options,
  onChange,
}: {
  active: string
  ariaLabel: string
  optionLabels?: Record<string, string>
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="mobile-segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const label = optionLabels?.[option] ?? option

        return (
          <button
            aria-selected={active === option}
            className="mobile-segmented__item"
            data-active={active === option}
            key={option}
            role="tab"
            type="button"
            onClick={() => onChange(option)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function StatusChip({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'danger' | 'gold' | 'green' | 'neutral'
}) {
  return (
    <div className="mobile-status-chip" data-tone={tone}>
      {children}
    </div>
  )
}

function KpiPill({
  icon,
  label,
  tone,
  value,
}: {
  icon: MobileIconName
  label: string
  tone: 'blue' | 'gold' | 'green' | 'purple'
  value: string
}) {
  return (
    <div className="mobile-kpi-pill" data-tone={tone}>
      <MobileIcon name={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function NodeIcon({ children, tone }: { children: ReactNode; tone: 'blue' | 'gold' | 'green' | 'neutral' | 'white' }) {
  return (
    <div className="mobile-node-icon" data-tone={tone}>
      {children}
    </div>
  )
}

function MobileBarChart({
  labels,
  unit,
  values,
}: {
  labels: string[]
  unit: 'kW'
  values: number[]
}) {
  const bars = normalizeSeries(values)

  return (
    <div className="mobile-bar-chart" aria-label="Solar production by hour">
      {bars.map((height, index) => (
        <button
          aria-label={`${labels[index]} ${formatChartValue(values[index] ?? 0, unit)}`}
          className="chart-hover-target"
          data-tooltip={`${labels[index]} · ${formatChartValue(values[index] ?? 0, unit)}`}
          key={`${labels[index]}-${index}`}
          style={{ height: `${height}%` }}
          type="button"
        />
      ))}
    </div>
  )
}

function MobileLineChart({
  color,
  labels,
  points,
  unit,
}: {
  color: string
  labels: string[]
  points: number[]
  unit: '%' | 'DKK/kWh' | 'kWh'
}) {
  const geometry = getChartGeometry(points)

  return (
    <div className="mobile-line-chart">
      <svg viewBox="0 0 320 140" aria-hidden="true">
        <defs>
          <linearGradient id={`mobile-line-fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={geometry.fillPath} fill={`url(#mobile-line-fill-${color.replace('#', '')})`} />
        <path d={geometry.linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {geometry.dots.map((point, index) => (
          <circle cx={point.x} cy={point.y} fill={color} key={index} r="3.25" />
        ))}
      </svg>

      <div className="chart-hit-grid">
        {points.map((point, index) => (
          <button
            aria-label={`${labels[index]} ${formatChartValue(point, unit)}`}
            className="chart-hover-target"
            data-tooltip={`${labels[index]} · ${formatChartValue(point, unit)}`}
            key={`${labels[index]}-${index}`}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

type MobileIconName =
  | 'battery'
  | 'bell'
  | 'car'
  | 'chevronDown'
  | 'grid'
  | 'home'
  | 'menu'
  | 'refresh'
  | 'solar'
  | 'sun'

function MobileIcon({ name }: { name: MobileIconName }) {
  return (
    <svg className="mobile-icon" viewBox="0 0 24 24" aria-hidden="true">
      {renderMobileIcon(name)}
    </svg>
  )
}

function renderMobileIcon(name: MobileIconName) {
  switch (name) {
    case 'battery':
      return (
        <>
          <rect x="7" y="4.5" width="10" height="15" rx="2.6" />
          <path d="M10 2.5h4" />
          <path d="M10 10h4M12 8v6" />
        </>
      )
    case 'bell':
      return (
        <>
          <path d="M12 4a4 4 0 0 1 4 4v2.2c0 .7.18 1.39.52 2l1.08 1.8H6.4l1.08-1.8c.34-.61.52-1.3.52-2V8a4 4 0 0 1 4-4Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </>
      )
    case 'car':
      return (
        <>
          <path d="M6.5 15 8 10.5c.28-.9 1.1-1.5 2.05-1.5h3.9c.95 0 1.77.6 2.05 1.5L17.5 15" />
          <path d="M5.5 15h13v2.5a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1V17h-6.6v.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1Z" />
          <circle cx="8.25" cy="15.5" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="15.75" cy="15.5" r="1.25" fill="currentColor" stroke="none" />
        </>
      )
    case 'chevronDown':
      return <path d="m7 10 5 5 5-5" />
    case 'grid':
      return (
        <>
          <path d="M12 3 8 9h8L12 3Zm0 0v18M6 13h12M7.5 18h9M9 9l-3 9M15 9l3 9" />
        </>
      )
    case 'home':
      return (
        <>
          <path d="m4 11 8-6 8 6" />
          <path d="M7 10.5V19h10v-8.5" />
          <path d="M10 19v-4h4v4" />
        </>
      )
    case 'menu':
      return <path d="M4 7h16M4 12h16M4 17h10" />
    case 'refresh':
      return (
        <>
          <path d="M19 12a7 7 0 1 1-2.05-4.95" />
          <path d="M19 5v4h-4" />
        </>
      )
    case 'solar':
      return (
        <>
          <path d="M9 11h8l-1.2 6H7.8L9 11ZM6.5 17h10M11.5 17v3M8.5 20h6" />
          <path d="M5 9h1.5M17.5 9H19M8 4.5l1 1.3M16 4.5l-1 1.3M12 3v1.8" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4.25" />
          <path d="M12 2.8v2.5M12 18.7v2.5M21.2 12h-2.5M5.3 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5" />
        </>
      )
  }
}

function normalizeSeries(values: number[]) {
  const max = Math.max(...values, 1)
  return values.map((value) => Math.max(4, (value / max) * 100))
}

function getChartGeometry(values: number[]) {
  const normalizedValues = values.length ? values : [0]
  const max = Math.max(...normalizedValues, 1)
  const height = 100
  const top = 16
  const left = 12
  const right = 308
  const baseline = 126
  const step = normalizedValues.length > 1 ? (right - left) / (normalizedValues.length - 1) : 0

  const points = normalizedValues.map((value, index) => ({
    x: Number((left + step * index).toFixed(2)),
    y: Number((top + height - (value / max) * height).toFixed(2)),
  }))

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const fillPath = `${linePath} L ${right} ${baseline} L ${left} ${baseline} Z`

  return { dots: points.filter((_, index) => index % 3 === 0 || index === points.length - 1), fillPath, linePath }
}

function getBatteryHistorySeries(socValue: number, period: BatteryPeriod) {
  const clampedSoc = clamp(socValue || 0, 0, 100)

  if (period === 'Day') {
    return {
      labels: Array.from({ length: 13 }, (_, index) => `${String(index * 2).padStart(2, '0')}:00`),
      points: Array.from({ length: 13 }, (_, index) => clamp(clampedSoc - 8 + index * 1.1, 0, 100)),
    }
  }

  if (period === 'Week') {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      points: Array.from({ length: 7 }, (_, index) => clamp(clampedSoc - 6 + index * 1.8, 0, 100)),
    }
  }

  return {
    labels: ['W1', 'W2', 'W3', 'W4'],
    points: Array.from({ length: 4 }, (_, index) => clamp(clampedSoc - 5 + index * 2.2, 0, 100)),
  }
}

function getBatteryInsights(battery: MobileDashboardProps['battery']) {
  const power = parseNumber(battery.power)
  const storedEnergy = parseNumber(battery.energy)
  const soc = clamp(battery.socValue || 0, 0, 100)
  const totalCapacity = soc > 0 && storedEnergy !== null ? storedEnergy / (soc / 100) : null
  const charging = battery.status === 'Charging'
  const discharging = battery.status === 'Discharging'
  const normalizedPower = power ?? 0
  const chargeRate = charging ? battery.power : '0.0'
  const dischargeRate = discharging ? battery.power : '0.0'

  let runtimeLabel = 'Estimated runtime'
  let runtimeValue = '---'

  if (charging && totalCapacity !== null && storedEnergy !== null && normalizedPower > 0) {
    runtimeLabel = 'Time to full'
    runtimeValue = formatDuration((totalCapacity - storedEnergy) / normalizedPower)
  } else if (discharging && storedEnergy !== null && normalizedPower > 0) {
    runtimeLabel = 'Time to empty'
    runtimeValue = formatDuration(storedEnergy / normalizedPower)
  }

  return {
    chargeRate,
    dischargeRate,
    runtimeLabel,
    runtimeValue,
  }
}

function formatChartValue(value: number, unit: '%' | 'DKK/kWh' | 'kW' | 'kWh') {
  const digits = unit === '%' ? 0 : 2
  return `${value.toFixed(digits)} ${unit}`
}

function formatDuration(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return '---'
  }

  const totalMinutes = Math.round(hours * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${wholeHours}h ${String(minutes).padStart(2, '0')} min`
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
