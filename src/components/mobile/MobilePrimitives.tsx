import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatChartValue, getBarChartGeometry, getMobileLineChartGeometry } from '../../services/chartGeometry'
import type { InsightHeaderControls } from '../../models/dashboardInsights'
import type { MobileTab } from './MobileTypes'
import { MOBILE_TABS } from './MobileConstants'
import type { MobileIconName } from './MobileConstants'

export function MobileStatusBar({ displayTime }: { displayTime: string }) {
  return (
    <div className="mobile-status-bar flex min-h-5 items-center justify-between px-1 text-[12px] font-medium tracking-[0.2em] text-white/82" aria-hidden="true">
      <span>{displayTime}</span>
      <div className="flex items-center gap-1.5">
        <i className="relative inline-grid h-[10px] w-[15px] grid-cols-3 items-end gap-px">
          <span className="block h-1 w-[2px] rounded-full bg-white" />
          <span className="block h-1.5 w-[2px] rounded-full bg-white" />
          <span className="block h-2 w-[2px] rounded-full bg-white" />
        </i>
        <i className="relative inline-block h-[10px] w-[14px]">
          <span className="absolute left-0 top-0 h-[14px] w-[14px] rounded-full border-[1.8px] border-white border-b-transparent border-l-transparent border-r-transparent" />
          <span className="absolute left-[3px] top-1 h-2 w-2 rounded-full border-[1.8px] border-white border-b-transparent border-l-transparent border-r-transparent" />
        </i>
        <i className="relative inline-block h-[11px] w-[22px] rounded-[3px] border-[1.7px] border-white/95">
          <span className="absolute inset-y-[2px] left-[3px] right-[3px] rounded-[1px] bg-white/95" />
          <span className="absolute right-[-3px] top-[3px] h-1 w-[2px] rounded-r-[1px] bg-white/95" />
        </i>
      </div>
    </div>
  )
}

export function MobileTopBar({ title }: { title: string }) {
  return (
    <header className="mobile-top-bar flex items-center justify-between gap-3">
      <button aria-label="Open menu" className="mobile-icon-button inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.26)] backdrop-blur-sm" type="button">
        <MobileIcon name="menu" />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <h1 className="inline-flex items-center gap-1 text-[clamp(18px,4.8vw,24px)] font-semibold tracking-[-0.02em] text-white">
          {title}
          {title === 'Home' ? <MobileIcon name="chevronDown" /> : null}
        </h1>
      </div>
      <button aria-label="Open notifications" className="mobile-icon-button relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.26)] backdrop-blur-sm" type="button">
        <MobileIcon name="bell" />
        <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full border-[1.5px] border-[#07111f] bg-dashboard-blue shadow-[0_0_12px_rgba(47,134,255,0.55)]" />
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
    <nav
      className="mobile-bottom-nav fixed inset-x-[max(14px,calc((100vw-430px)/2+14px))] bottom-[max(8px,env(safe-area-inset-bottom))] z-[60] grid min-h-[var(--mobile-nav-height)] grid-cols-4 gap-1 rounded-[22px] border border-white/10 bg-[#0a0f17]/88 p-[7px_8px] shadow-[0_-8px_24px_rgba(0,0,0,0.22),0_18px_44px_rgba(0,0,0,0.36)] backdrop-blur-xl"
      aria-label="Mobile dashboard navigation"
    >
      {MOBILE_TABS.map((tab) => (
        <button
          aria-current={tab.key === activeTab ? 'page' : undefined}
          className={cn(
            'mobile-bottom-nav__item flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition',
            tab.key === activeTab ? 'bg-white/[0.065] text-white' : 'text-white/58',
          )}
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
  controls,
  controlsNode,
  metric,
  summary,
  title,
  unit,
  windowLabel,
}: {
  accent: 'blue' | 'solar'
  actionLabel?: string
  children: ReactNode
  controls?: InsightHeaderControls
  controlsNode?: ReactNode
  metric: string
  summary?: Array<{ label: string; value: string }>
  title: string
  unit: string
  windowLabel?: string
}) {
  return (
    <GlassCard className="mobile-analytics-card p-5" data-accent={accent}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-[clamp(18px,4.8vw,22px)] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        {controlsNode ? controlsNode : controls ? <MobileInsightControls controls={controls} /> : <MobileCardAction label={actionLabel ?? 'Today'} />}
      </div>

      {windowLabel ? <div className="mobile-window-chip mb-4 inline-flex min-h-6 items-center rounded-chip border border-white/10 bg-white/[0.035] px-2.5 text-[10px] font-medium text-dashboard-soft">{windowLabel}</div> : null}

      <div className="mb-4">
        <strong className="inline-flex items-baseline gap-[7px] text-[20px] leading-none text-white">
          {metric}
          <small className="text-[13px] font-bold text-[#dde4f1]">{unit}</small>
        </strong>
      </div>

      {summary?.length ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {summary.slice(0, 3).map((item) => (
            <div className="mobile-card-summary__item rounded-2xl border border-white/8 bg-black/20 px-3 py-2" key={item.label}>
              <span className="block text-[10px] text-dashboard-muted">{item.label}</span>
              <strong className="mt-1 block text-[13px] font-semibold text-white">{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div className="min-h-[164px] pt-2">{children}</div>
    </GlassCard>
  )
}

export function MobileInsightControls({ controls }: { controls: InsightHeaderControls }) {
  const [isOpen, setIsOpen] = useState(false)
  const activeLabel = useMemo(() => (controls.mode === 'today' ? 'Today overview' : 'Timeline'), [controls.mode])

  return (
    <div className="mobile-insight-controls flex items-center gap-2">
      <button
        aria-label="Show previous insight window"
        className="mobile-insight-controls__arrow inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white transition disabled:opacity-40"
        disabled={!controls.canGoPrevious}
        type="button"
        onClick={controls.onPrevious}
      >
        <MobileIcon name="chevronLeft" />
      </button>

      <div className="relative">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="inline-flex h-10 min-w-[142px] items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-[13px] font-medium text-white"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          {activeLabel}
          <MobileIcon name="chevronDown" className="h-[14px] w-[14px]" />
        </button>

        {isOpen ? (
          <div className="mobile-insight-controls__dropdown absolute left-0 top-full z-20 mt-2 min-w-full rounded-2xl border border-white/10 bg-[#0b1118]/95 p-1 shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl" role="menu">
            {[
              { label: 'Today overview', mode: 'today' },
              { label: 'Timeline', mode: 'timeline' },
            ].map((option) => (
              <button
                key={option.mode}
                aria-pressed={controls.mode === option.mode}
                className={cn(
                  'mobile-insight-controls__option w-full rounded-xl px-3 py-2 text-left text-[13px] transition',
                  controls.mode === option.mode ? 'bg-white/[0.08] text-white' : 'text-white/72 hover:bg-white/[0.05]',
                )}
                data-active={controls.mode === option.mode}
                role="menuitem"
                type="button"
                onClick={() => {
                  if (controls.mode !== option.mode) {
                    controls.onToggleMode()
                  }
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        aria-label="Show next insight window"
        className="mobile-insight-controls__arrow inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white transition disabled:opacity-40"
        disabled={!controls.canGoNext}
        type="button"
        onClick={controls.onNext}
      >
        <MobileIcon name="chevronRight" />
      </button>
    </div>
  )
}

function MobileCardAction({ label }: { label: string }) {
  return (
    <button className="inline-flex h-10 min-w-[92px] items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-[13px] font-medium text-white" type="button">
      {label}
      <MobileIcon name="chevronDown" className="h-[14px] w-[14px]" />
    </button>
  )
}

export function SmallMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard className="mobile-small-metric-card rounded-3xl p-4">
      <span className="block text-[11px] text-dashboard-muted">{label}</span>
      <strong className="mt-2 block text-[16px] font-semibold text-white">{value}</strong>
    </GlassCard>
  )
}

export function GlassCard({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('dashboard-glass-panel rounded-[24px]', className)} {...props}>
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_28%)]" aria-hidden="true" />
      {children}
    </section>
  )
}

export function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-[clamp(18px,4.8vw,22px)] font-semibold tracking-[-0.02em] text-white">{title}</h2>
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
    <div className="mobile-segmented grid grid-flow-col auto-cols-fr gap-1.5 rounded-[20px] border border-white/10 bg-black/25 p-1" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const label = optionLabels?.[option] ?? option

        return (
          <button
            aria-selected={active === option}
            className={cn(
              'mobile-segmented__item flex-1 rounded-2xl px-3 py-2 text-[13px] font-medium transition',
              active === option ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' : 'text-white/60',
            )}
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
    <div
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 rounded-chip border px-3 text-[11px] font-semibold',
        tone === 'green'
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
          : tone === 'danger'
            ? 'border-rose-400/25 bg-rose-400/10 text-rose-300'
            : tone === 'gold'
              ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
              : 'border-white/12 bg-white/[0.05] text-white/82',
      )}
      data-tone={tone}
    >
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
    <div
      className={cn(
        'mobile-kpi-pill inline-flex items-center gap-3 rounded-[20px] border px-3 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-sm',
        tone === 'gold'
          ? 'border-amber-300/15 bg-amber-300/8 text-amber-200'
          : tone === 'green'
            ? 'border-emerald-400/15 bg-emerald-400/8 text-emerald-200'
            : tone === 'purple'
              ? 'border-violet-400/15 bg-violet-400/8 text-violet-200'
              : 'border-sky-400/15 bg-sky-400/8 text-sky-200',
      )}
      data-tone={tone}
    >
      <MobileIcon name={icon} />
      <div className="grid gap-0.5">
        <span className="text-[10px] text-current/80">{label}</span>
        <strong className="text-[13px] font-semibold text-white">{value}</strong>
      </div>
    </div>
  )
}

export function NodeIcon({ children, tone }: { children: ReactNode; tone: 'blue' | 'gold' | 'green' | 'neutral' | 'white' }) {
  return (
    <div
      className={cn(
        'mobile-node-icon inline-grid h-11 w-11 place-items-center rounded-full border bg-black/40',
        tone === 'gold'
          ? 'border-amber-300/20 text-amber-300 shadow-[0_0_22px_rgba(255,190,47,0.18)]'
          : tone === 'green'
            ? 'border-emerald-400/20 text-emerald-300 shadow-[0_0_22px_rgba(110,245,133,0.16)]'
            : tone === 'blue'
              ? 'border-sky-400/20 text-sky-300 shadow-[0_0_22px_rgba(59,130,255,0.18)]'
              : tone === 'white'
                ? 'border-white/15 text-white'
                : 'border-white/12 text-white/78',
      )}
      data-tone={tone}
    >
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
  const isPrice = unit === 'DKK/kWh'

  return (
    <div
      className="relative flex h-[156px] gap-1.5 px-1 pb-[18px] pt-[14px]"
      data-flat={geometry.isFlat}
      data-unit={unit}
      style={{ '--zero-y': `${geometry.zeroY}%` } as CSSProperties}
      aria-label="Solar production by hour"
    >
      <span
        className="pointer-events-none absolute inset-x-0 bottom-[18px] top-3 bg-[repeating-linear-gradient(to_top,transparent_0_25px,rgba(255,255,255,0.06)_25px_26px)]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute left-0 right-0 top-[var(--zero-y)] z-[1] h-px bg-[rgba(236,242,255,0.24)] shadow-[0_0_10px_rgba(236,242,255,0.12)]"
        aria-hidden="true"
      />
      {geometry.bars.map((bar, index) => (
        <button
          aria-label={`${labels[index]} ${formatChartValue(values[index] ?? 0, unit)}`}
          className="group relative z-[1] h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 after:pointer-events-none after:absolute after:bottom-[calc(100%+8px)] after:left-1/2 after:z-10 after:min-w-max after:-translate-x-1/2 after:translate-y-1 after:rounded-md after:border after:border-white/20 after:bg-[rgba(5,10,16,0.94)] after:px-2 after:py-1.5 after:text-[11px] after:font-[650] after:text-[#f8fbff] after:opacity-0 after:shadow-[0_10px_24px_rgba(0,0,0,0.35)] after:transition after:content-[attr(data-tooltip)] hover:after:translate-y-0 hover:after:opacity-100"
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
          <span
            className={cn(
              'absolute top-[var(--bar-top)] min-h-[2px] rounded-[8px]',
              isPrice ? 'left-0 right-0 min-h-[4px]' : 'left-[8%] right-[8%]',
              isPrice
                ? 'bg-[linear-gradient(180deg,#70a7ff,#1f73ff)] shadow-[0_0_14px_rgba(59,130,255,0.48)]'
                : 'bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bar-color,#f6a621)_82%,white),var(--bar-color,#f6a621))] shadow-[0_0_12px_color-mix(in_srgb,var(--bar-color,#f6a621)_42%,transparent)]',
              bar.isNegative && 'bg-[linear-gradient(180deg,#68d9ff,#3b82ff)] shadow-[0_0_12px_rgba(59,130,255,0.34)]',
              geometry.isFlat && 'opacity-70',
            )}
            aria-hidden="true"
            style={{ height: 'var(--bar-height)' } as CSSProperties}
          />
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
    <div className="relative h-[156px]" data-flat={geometry.isFlat}>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-[18px] top-3 bg-[repeating-linear-gradient(to_top,transparent_0_25px,rgba(255,255,255,0.06)_25px_26px)]"
        aria-hidden="true"
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 140" aria-hidden="true">
        <defs>
          <linearGradient id={`mobile-line-fill-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          className="stroke-[rgba(236,242,255,0.24)] [stroke-dasharray:5_7] [stroke-linecap:round] [stroke-width:1]"
          x1="12"
          x2="308"
          y1={geometry.zeroY}
          y2={geometry.zeroY}
        />
        <path d={geometry.fillPath} fill={`url(#mobile-line-fill-${color.replace('#', '')})`} />
        <path d={geometry.linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {geometry.dots.map((point, index) => (
          <circle cx={point.x} cy={point.y} fill={color} key={index} r="3.25" />
        ))}
      </svg>

      <div className="absolute inset-x-0 bottom-4 top-0 z-[2] grid grid-flow-col auto-cols-fr">
        {points.map((point, index) => (
          <button
            aria-label={`${labels[index]} ${formatChartValue(point, unit)}`}
            className="relative h-full min-w-0 cursor-crosshair appearance-none border-0 bg-transparent p-0 after:pointer-events-none after:absolute after:bottom-[calc(100%+8px)] after:left-1/2 after:z-10 after:min-w-max after:-translate-x-1/2 after:translate-y-1 after:rounded-md after:border after:border-white/20 after:bg-[rgba(5,10,16,0.94)] after:px-2 after:py-1.5 after:text-[11px] after:font-[650] after:text-[#f8fbff] after:opacity-0 after:shadow-[0_10px_24px_rgba(0,0,0,0.35)] after:transition after:content-[attr(data-tooltip)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),transparent)] hover:after:translate-y-0 hover:after:opacity-100"
            data-tooltip={`${labels[index]} · ${formatChartValue(point, unit)}`}
            key={`${labels[index]}-${index}`}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

export function MobileIcon({ className, name }: { className?: string; name: MobileIconName }) {
  return (
    <svg className={cn('h-5 w-5 fill-none stroke-current stroke-[1.9] [stroke-linecap:round] [stroke-linejoin:round]', className)} viewBox="0 0 24 24" aria-hidden="true">
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
    case 'chevronLeft':
      return <path d="m14.5 6-5 6 5 6" />
    case 'chevronDown':
      return <path d="m7 10 5 5 5-5" />
    case 'chevronRight':
      return <path d="m9.5 6 5 6-5 6" />
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
