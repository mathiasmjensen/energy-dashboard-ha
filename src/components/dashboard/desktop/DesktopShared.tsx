import type { CSSProperties, ReactNode } from 'react'
import type { InsightHeaderControls } from '../../../services/dashboardInsights'
import {
  formatChartValue,
  formatChartXAxisLabel,
  getBarChartGeometry,
  getDesktopLineChartGeometry,
} from '../../../services/chartGeometry'

export type IconName =
  | 'battery'
  | 'bolt'
  | 'car'
  | 'clock'
  | 'grid'
  | 'history'
  | 'home'
  | 'settings'
  | 'solar'
  | 'sun'
  | 'zap'

export type DayHeaderControls = {
  canGoNext: boolean
  canGoPrevious: boolean
  label: string
  onNext: () => void
  onPrevious: () => void
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`overview-panel ${className}`}>{children}</section>
}

export function StatusPill({
  icon,
  primary,
  secondary,
  tone,
}: {
  icon?: IconName
  primary: string
  secondary: string
  tone?: 'ok' | 'sun'
}) {
  return (
    <div className="status-pill" data-tone={tone}>
      {icon ? <OverviewIcon name={icon} /> : <span className="status-dot" />}
      <div>
        <strong>{primary}</strong>
        <span>{secondary}</span>
      </div>
    </div>
  )
}

export function PanelHeader({
  controls,
  showPeriod = true,
  title,
}: {
  controls?: ReactNode
  showPeriod?: boolean
  title: string
}) {
  return (
    <header className="overview-panel-header">
      <h2>{title}</h2>
      {controls ? (
        controls
      ) : showPeriod ? (
        <span className="panel-period">
          Today
          <span aria-hidden="true">v</span>
        </span>
      ) : null}
    </header>
  )
}

export function InsightToolbar({
  controls,
  windowLabel,
}: {
  controls: InsightHeaderControls
  windowLabel: string
}) {
  return (
    <div className="insight-toolbar">
      <InsightWindowControls {...controls} />
      <small className="panel-window-chip">{windowLabel}</small>
    </div>
  )
}

export function InsightWindowControls({
  canGoNext,
  canGoPrevious,
  mode,
  onNext,
  onPrevious,
  onToggleMode,
}: InsightHeaderControls) {
  return (
    <div className="insight-window-controls" role="group" aria-label="Insight time range controls">
      <button
        aria-label="Show previous insight window"
        className="insight-window-arrow"
        disabled={!canGoPrevious}
        type="button"
        onClick={onPrevious}
      >
        ‹
      </button>
      <button
        aria-label={`Switch to ${mode === 'today' ? 'timeline' : 'today overview'}`}
        className="insight-window-toggle"
        type="button"
        onClick={onToggleMode}
      >
        {mode === 'today' ? 'Today overview' : 'Timeline'}
      </button>
      <button
        aria-label="Show next insight window"
        className="insight-window-arrow"
        disabled={!canGoNext}
        type="button"
        onClick={onNext}
      >
        ›
      </button>
    </div>
  )
}

export function DayWindowControls({
  canGoNext,
  canGoPrevious,
  label,
  onNext,
  onPrevious,
}: DayHeaderControls) {
  return (
    <div className="insight-window-controls" role="group" aria-label="Historical energy day controls">
      <button
        aria-label="Show previous energy day"
        className="insight-window-arrow"
        disabled={!canGoPrevious}
        type="button"
        onClick={onPrevious}
      >
        ‹
      </button>
      <div className="insight-window-toggle insight-window-toggle--static">{label}</div>
      <button
        aria-label="Show next energy day"
        className="insight-window-arrow"
        disabled={!canGoNext}
        type="button"
        onClick={onNext}
      >
        ›
      </button>
    </div>
  )
}

export function BarChart({
  className,
  label,
  labels,
  unit,
  values,
}: {
  className?: string
  label: string
  labels?: string[]
  unit: 'DKK/kWh' | 'kW' | 'kWh'
  values: number[]
}) {
  const geometry = getBarChartGeometry(values)

  return (
    <div
      className={`overview-bar-chart ${className ?? ''}`.trim()}
      aria-label={label}
      data-flat={geometry.isFlat}
      data-unit={unit}
    >
      <span
        className="overview-bar-chart__zero"
        style={{ '--zero-y': `${geometry.zeroY}%` } as CSSProperties}
      />
      {geometry.bars.map((bar, index) => (
        <button
          aria-label={`${formatChartXAxisLabel(labels, index)} ${formatChartValue(values[index] ?? 0, unit)}`}
          className="chart-hover-target"
          data-negative={bar.isNegative}
          data-tooltip={`${formatChartXAxisLabel(labels, index)} · ${formatChartValue(values[index] ?? 0, unit)}`}
          key={index}
          style={
            {
              '--bar-height': `${bar.height}%`,
              '--bar-top': `${bar.top}%`,
            } as CSSProperties
          }
          type="button"
        >
          <span className="overview-bar-chart__bar" />
        </button>
      ))}
    </div>
  )
}

export function LineChart({
  className,
  color,
  label,
  labels,
  points,
  unit,
}: {
  className?: string
  color: string
  label: string
  labels?: string[]
  points: number[]
  unit: '%' | 'DKK/kWh' | 'kW' | 'kWh'
}) {
  const geometry = getDesktopLineChartGeometry(points)

  return (
    <div className={`overview-line-chart ${className ?? ''}`.trim()} aria-label={label}>
      <svg viewBox="-4 0 318 120" aria-hidden="true">
        <defs>
          <linearGradient id={`line-fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="overview-line-zero" x1="0" x2="310" y1={geometry.zeroY} y2={geometry.zeroY} />
        <path d={`${geometry.fill}Z`} fill={`url(#line-fill-${color.replace('#', '')})`} />
        <polyline
          fill="none"
          points={geometry.line}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {geometry.dots.map((point, index) => (
          <circle cx={point.x} cy={point.y} fill={color} key={index} r="3" />
        ))}
      </svg>
      <div className="chart-hit-grid">
        {points.map((point, index) => (
          <button
            aria-label={`${formatChartXAxisLabel(labels, index)} ${formatChartValue(point, unit)}`}
            className="chart-hover-target"
            data-tooltip={`${formatChartXAxisLabel(labels, index)} · ${formatChartValue(point, unit)}`}
            key={index}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

export function OverviewIcon({ name }: { name: IconName }) {
  return (
    <svg className="overview-icon" viewBox="0 0 24 24" aria-hidden="true">
      {renderOverviewIcon(name)}
    </svg>
  )
}

function renderOverviewIcon(name: IconName) {
  switch (name) {
    case 'battery':
      return <path d="M8 6h8v2h2v12H6V8h2V6Zm1 6h6M12 10v8" />
    case 'bolt':
      return <path d="m13 2-7 12h5l-1 8 8-13h-5l0-7Z" fill="currentColor" stroke="none" />
    case 'car':
      return (
        <>
          <path d="M4 13h16l-2-5H7l-3 5Zm0 0v5h3m10 0h3v-5M8 18h8" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="16" cy="18" r="2" />
        </>
      )
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l4 2" />
        </>
      )
    case 'grid':
      return <path d="M12 3 6 21m6-18 6 18M5 21h14M7 15h10M8.5 10h7M6 7h12l-6-4-6 4Z" />
    case 'history':
      return <path d="M4 12a8 8 0 1 0 2.3-5.6M4 5v5h5M12 8v5l3 2" />
    case 'home':
      return <path d="M3 11 12 4l9 7v9h-6v-6H9v6H3v-9Z" fill="currentColor" stroke="none" />
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.6 1l-2.5-1-2 3.4L5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.5-1a7 7 0 0 0 1.6 1l.4 3.1h5l.3-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </>
      )
    case 'solar':
      return (
        <>
          <circle cx="12" cy="6" r="2.5" />
          <path d="M12 1v2M12 9v2M7 6H5m14 0h-2M8.5 2.5 10 4M14 8l1.5 1.5M15.5 2.5 14 4M10 8 8.5 9.5M6 13h12l2 7H4l2-7Zm4 0-1 7m5-7 1 7M5 17h14" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
        </>
      )
    case 'zap':
      return <path d="m13 2-8 12h6l-1 8 9-14h-6V2Z" fill="currentColor" stroke="none" />
  }
}
