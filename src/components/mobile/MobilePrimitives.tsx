import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { formatChartValue, getBarChartGeometry, getMobileLineChartGeometry } from '../../services/chartGeometry'
import type { MobileTab } from './MobileTypes'
import { MOBILE_TABS } from './MobileConstants'
import type { MobileIconName } from './MobileConstants'

export function MobileStatusBar({ displayTime }: { displayTime: string }) {
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

export function MobileTopBar({ title }: { title: string }) {
  return (
    <header className="mobile-top-bar">
      <button aria-label="Open menu" className="mobile-icon-button" type="button">
        <MobileIcon name="menu" />
      </button>
      <div className="mobile-top-bar__title">
        <h1>
          {title}
          {title === 'Home' ? <MobileIcon name="chevronDown" /> : null}
        </h1>
      </div>
      <button aria-label="Open notifications" className="mobile-icon-button mobile-icon-button--bell" type="button">
        <MobileIcon name="bell" />
      </button>
    </header>
  )
}

export function MobileBottomNav({
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

export function AnalyticsCard({
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
  summary?: Array<{ label: string; value: string }>
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

export function SmallMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="mobile-small-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </GlassCard>
  )
}

export function GlassCard({
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

export function SectionHeading({ title }: { title: string }) {
  return <h2 className="mobile-section-heading">{title}</h2>
}

export function SegmentedControl({
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

export function StatusChip({
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

export function KpiPill({
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

export function NodeIcon({ children, tone }: { children: ReactNode; tone: 'blue' | 'gold' | 'green' | 'neutral' | 'white' }) {
  return (
    <div className="mobile-node-icon" data-tone={tone}>
      {children}
    </div>
  )
}

export function FlowPath({
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

export function FloatingLabel({
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

export function MobileBarChart({
  color = '#f6a621',
  labels,
  unit,
  values,
}: {
  color?: string
  labels: string[]
  unit: 'DKK/kWh' | 'kW' | 'kWh'
  values: number[]
}) {
  const geometry = getBarChartGeometry(values)

  return (
    <div
      className="mobile-bar-chart"
      data-flat={geometry.isFlat}
      data-unit={unit}
      style={{ '--zero-y': `${geometry.zeroY}%` } as CSSProperties}
      aria-label="Solar production by hour"
    >
      <span className="mobile-chart-zero-line" aria-hidden="true" />
      {geometry.bars.map((bar, index) => (
        <button
          aria-label={`${labels[index]} ${formatChartValue(values[index] ?? 0, unit)}`}
          className="chart-hover-target"
          data-negative={bar.isNegative}
          data-tooltip={`${labels[index]} · ${formatChartValue(values[index] ?? 0, unit)}`}
          key={`${labels[index]}-${index}`}
          style={
            {
              '--bar-color': color,
              '--bar-height': `${bar.height}%`,
              '--bar-top': `${bar.top}%`,
            } as CSSProperties
          }
          type="button"
        >
          <span className="mobile-bar-chart__bar" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export function MobileLineChart({
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
  const geometry = getMobileLineChartGeometry(points)

  return (
    <div className="mobile-line-chart" data-flat={geometry.isFlat}>
      <svg viewBox="0 0 320 140" aria-hidden="true">
        <defs>
          <linearGradient id={`mobile-line-fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="mobile-line-chart__zero" x1="12" x2="308" y1={geometry.zeroY} y2={geometry.zeroY} />
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

export function MobileIcon({ name }: { name: MobileIconName }) {
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
      return <path d="M12 3 8 9h8L12 3Zm0 0v18M6 13h12M7.5 18h9M9 9l-3 9M15 9l3 9" />
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
