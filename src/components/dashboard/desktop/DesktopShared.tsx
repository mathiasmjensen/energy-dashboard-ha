import type { CSSProperties, ReactNode } from 'react'
import type { DataStateBadgeModel } from '../../../models/dataState'
import type { InsightHeaderControls } from '../../../models/dashboardInsights'
import { cn } from '../../../lib/cn'
import {
  formatChartValue,
  formatChartXAxisLabel,
  getBarChartGeometry,
  getDesktopLineChartGeometry,
} from '../../../services/chartGeometry'

export type IconName =
  | 'battery'
  | 'bell'
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
  return <section className={cn('dashboard-glass-panel relative overflow-hidden', className)}>{children}</section>
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
    <div
      className={cn(
        'inline-flex min-h-[52px] items-center gap-3 rounded-[999px] border px-4 py-2 text-left shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm',
        tone === 'ok'
          ? 'border-emerald-400/20 bg-emerald-400/8'
          : tone === 'sun'
            ? 'border-amber-300/15 bg-white/[0.035]'
            : 'border-white/10 bg-white/[0.035]',
      )}
      data-tone={tone}
    >
      {icon ? <OverviewIcon name={icon} /> : <span className="h-5 w-5 rounded-full bg-dashboard-green shadow-[0_0_18px_rgba(51,214,107,0.4)]" />}
      <div className="grid gap-0.5">
        <strong className="text-[15px] font-semibold leading-none text-white">{primary}</strong>
        <span className="text-[12px] leading-none text-dashboard-soft">{secondary}</span>
      </div>
    </div>
  )
}

export function PanelHeader({
  badge,
  controls,
  showPeriod = true,
  title,
}: {
  badge?: DataStateBadgeModel
  controls?: ReactNode
  showPeriod?: boolean
  title: string
}) {
  return (
    <header className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate whitespace-nowrap text-[17px] font-[760] leading-none tracking-[-0.01em] text-white">{title}</h2>
        {badge ? <DataStateBadge badge={badge} /> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {controls ? (
          controls
        ) : showPeriod ? (
          <span className="inline-flex h-[30px] min-w-[98px] items-center justify-between rounded-md border border-white/10 bg-black/25 px-2.5 text-[12px] text-white">
            Today
            <span aria-hidden="true">v</span>
          </span>
        ) : null}
      </div>
    </header>
  )
}

export function DataStateBadge({ badge }: { badge: DataStateBadgeModel }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
        badge.tone === 'live' && 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
        badge.tone === 'mock' && 'border-sky-400/25 bg-sky-400/10 text-sky-100',
        badge.tone === 'stale' && 'border-amber-300/25 bg-amber-300/10 text-amber-100',
      )}
    >
      {badge.label}
    </span>
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
    <div className="grid justify-items-start gap-2">
      <InsightWindowControls {...controls} />
      <small className="inline-flex min-h-5 items-center rounded-chip border border-white/10 bg-white/[0.035] px-2 text-[9px] font-semibold leading-none text-[#b4bfcd]">
        {windowLabel}
      </small>
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
    <div className="inline-flex shrink-0 items-center gap-1.5" role="group" aria-label="Insight time range controls">
      <button
        aria-label="Show previous insight window"
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-md border border-white/10 bg-black/25 text-[18px] leading-none text-[#e7ecf3] transition hover:border-white/20 hover:bg-[#0a111a] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canGoPrevious}
        type="button"
        onClick={onPrevious}
      >
        ‹
      </button>
      <button
        aria-label={`Switch to ${mode === 'today' ? 'timeline' : 'today overview'}`}
        className="inline-flex h-[28px] min-w-[96px] items-center justify-center rounded-md border border-white/10 bg-black/25 px-2 text-[10px] font-[650] text-[#e7ecf3] transition hover:border-white/20 hover:bg-[#0a111a]"
        type="button"
        onClick={onToggleMode}
      >
        {mode === 'today' ? 'Today overview' : 'Timeline'}
      </button>
      <button
        aria-label="Show next insight window"
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-md border border-white/10 bg-black/25 text-[18px] leading-none text-[#e7ecf3] transition hover:border-white/20 hover:bg-[#0a111a] disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="inline-flex shrink-0 items-center gap-1.5" role="group" aria-label="Historical energy day controls">
      <button
        aria-label="Show previous energy day"
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-md border border-white/10 bg-black/25 text-[18px] leading-none text-[#e7ecf3] transition hover:border-white/20 hover:bg-[#0a111a] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!canGoPrevious}
        type="button"
        onClick={onPrevious}
      >
        ‹
      </button>
      <div className="inline-flex h-[28px] min-w-[96px] items-center justify-center rounded-md border border-white/10 bg-black/25 px-2 text-[10px] font-[650] text-[#e7ecf3]">
        {label}
      </div>
      <button
        aria-label="Show next energy day"
        className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-md border border-white/10 bg-black/25 text-[18px] leading-none text-[#e7ecf3] transition hover:border-white/20 hover:bg-[#0a111a] disabled:cursor-not-allowed disabled:opacity-40"
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
  const isInsight = className?.includes('insight-bar-chart')
  const isPrice = unit === 'DKK/kWh' || className?.includes('insight-bar-chart--prices')

  return (
    <div
      className={cn(
        isInsight
          ? 'relative flex h-full min-h-[96px] w-full gap-[5px] border-b-0 px-1 pb-[10px] pt-2'
          : 'absolute bottom-[30px] left-[52px] right-8 flex h-[93px] items-end gap-1.5 border-b border-white/10',
        className,
      )}
      aria-label={label}
      data-flat={geometry.isFlat}
      data-unit={unit}
    >
      <span
        className={cn(
          'pointer-events-none absolute content-[""]',
          isInsight
            ? 'inset-x-0 bottom-3 top-2 border-b border-white/10 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.08)),repeating-linear-gradient(to_top,transparent_0_23px,rgba(255,255,255,0.06)_24px)]'
            : 'inset-0 bg-[repeating-linear-gradient(to_top,transparent_0_22px,rgba(255,255,255,0.06)_23px)]',
        )}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute left-0 right-0 z-[1] h-px bg-[rgba(236,242,255,0.2)] shadow-[0_0_10px_rgba(236,242,255,0.12)]"
        style={{ '--zero-y': `${geometry.zeroY}%` } as CSSProperties}
        aria-hidden="true"
      />
      {geometry.bars.map((bar, index) => (
        <button
          aria-label={`${formatChartXAxisLabel(labels, index)} ${formatChartValue(values[index] ?? 0, unit)}`}
          className={cn(
            'group relative z-[1] min-h-0 appearance-none border-0 bg-transparent p-0 after:pointer-events-none after:absolute after:bottom-[calc(100%+8px)] after:left-1/2 after:z-10 after:min-w-max after:-translate-x-1/2 after:translate-y-1 after:rounded-md after:border after:border-white/20 after:bg-[rgba(5,10,16,0.94)] after:px-2 after:py-1.5 after:text-[11px] after:font-[650] after:text-[#f8fbff] after:opacity-0 after:shadow-[0_10px_24px_rgba(0,0,0,0.35)] after:transition after:content-[attr(data-tooltip)] hover:after:translate-y-0 hover:after:opacity-100',
            isInsight ? 'min-w-[3px] flex-1' : 'h-full w-2 cursor-crosshair rounded-none',
          )}
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
          <span
            className={cn(
              'absolute top-[var(--bar-top)] min-h-[2px] rounded-[4px]',
              isInsight ? 'left-[8%] right-[8%]' : 'left-0 right-0',
              isPrice
                ? 'bg-[linear-gradient(180deg,#77aaff_0%,#3f83ff_58%,#215ede_100%)] shadow-[0_0_14px_rgba(63,131,255,0.3)]'
                : 'bg-[linear-gradient(180deg,#ffd464_0%,#f5a623_58%,#d98a14_100%)] shadow-[0_0_12px_rgba(245,166,35,0.25)]',
              bar.isNegative && 'bg-[linear-gradient(180deg,#69dcff_0%,#34a4ff_58%,#206ad9_100%)] shadow-[0_0_12px_rgba(52,164,255,0.24)]',
              geometry.isFlat && 'opacity-80',
            )}
            style={{ height: 'var(--bar-height)' } as CSSProperties}
          />
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
  const isInsight = className?.includes('insight-line-chart')

  return (
    <div
      className={cn(
        isInsight
          ? 'relative h-full w-full'
          : 'absolute bottom-[22px] left-[18px] right-[18px] z-[3] h-[118px] w-[calc(100%-36px)] overflow-visible',
        className,
      )}
      aria-label={label}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="-4 0 318 120" aria-hidden="true">
        <defs>
          <linearGradient id={`line-fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          className="stroke-[rgba(236,242,255,0.22)] [stroke-dasharray:5_7] [stroke-linecap:round] [stroke-width:1]"
          x1="0"
          x2="310"
          y1={geometry.zeroY}
          y2={geometry.zeroY}
        />
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
      <div className={cn('absolute inset-0 z-[2] grid grid-flow-col auto-cols-fr', isInsight ? 'inset-0' : 'inset-0')}>
        {points.map((point, index) => (
          <button
            aria-label={`${formatChartXAxisLabel(labels, index)} ${formatChartValue(point, unit)}`}
            className="relative h-full min-w-0 cursor-crosshair appearance-none border-0 bg-transparent p-0 after:pointer-events-none after:absolute after:bottom-[calc(100%+8px)] after:left-1/2 after:z-10 after:min-w-max after:-translate-x-1/2 after:translate-y-1 after:rounded-md after:border after:border-white/20 after:bg-[rgba(5,10,16,0.94)] after:px-2 after:py-1.5 after:text-[11px] after:font-[650] after:text-[#f8fbff] after:opacity-0 after:shadow-[0_10px_24px_rgba(0,0,0,0.35)] after:transition after:content-[attr(data-tooltip)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)] hover:after:translate-y-0 hover:after:opacity-100"
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
    <svg
      className="h-6 w-6 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.85]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {renderOverviewIcon(name)}
    </svg>
  )
}

function renderOverviewIcon(name: IconName) {
  switch (name) {
    case 'battery':
      return <path d="M8 6h8v2h2v12H6V8h2V6Zm1 6h6M12 10v8" />
    case 'bell':
      return (
        <>
          <path d="M12 4a4 4 0 0 1 4 4v2.2c0 .7.18 1.39.52 2l1.08 1.8H6.4l1.08-1.8c.34-.61.52-1.3.52-2V8a4 4 0 0 1 4-4Z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </>
      )
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
