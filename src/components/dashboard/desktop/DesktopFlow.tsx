import { cn } from '../../../lib/cn'

export function EnergyFlowMap({
  batteryPowerValue,
  evChargePowerValue,
  gridPowerValue,
}: {
  batteryPowerValue: number | null
  evChargePowerValue: number | null
  gridPowerValue: number | null
}) {
  const gridDirection = gridPowerValue !== null && gridPowerValue < -0.05 ? 'reverse' : 'forward'
  const batteryDirection = batteryPowerValue !== null && batteryPowerValue < -0.05 ? 'reverse' : 'forward'
  const evState = evChargePowerValue !== null && Math.abs(evChargePowerValue) > 0.05 ? 'active' : 'idle'

  return (
    <svg className="absolute left-[42px] top-[386px] h-[158px] w-[846px] overflow-visible" viewBox="0 0 846 158" aria-hidden="true">
      <FlowPath color="#f5a623" d="M186 28H300Q330 28 348 58" />
      <FlowPath color="#33d66b" d="M484 58Q508 28 548 28H648" reverse={batteryDirection === 'reverse'} />
      <FlowPath color="#a64df5" d="M186 112H300Q330 112 348 86" reverse={gridDirection === 'reverse'} />
      <FlowPath color="#a6adb6" d="M484 86Q508 112 548 112H648" state={evState} />
    </svg>
  )
}

export function FlowNode({
  badge,
  className,
  label,
  meta,
  onClick,
  tone,
  unit,
  value,
}: {
  badge?: string
  className: string
  label: string
  meta?: string
  onClick?: () => void
  tone: 'blue' | 'green' | 'muted' | 'purple' | 'sun'
  unit: string
  value: string
}) {
  const toneClassName =
    tone === 'sun'
      ? 'text-dashboard-orange'
      : tone === 'purple'
        ? 'text-dashboard-purple'
        : tone === 'blue'
          ? 'text-[#6b8bff]'
          : tone === 'green'
            ? 'text-dashboard-green'
            : 'text-[#a6adb6]'

  const content = (
    <>
      <span className="mt-[7px] h-2 w-2 self-start rounded-full bg-current shadow-[0_0_12px_currentColor]" aria-hidden="true" />
      <div className="min-w-0">
        <span className="block text-[11px] text-current">{label}</span>
        <strong className="mt-0.5 block text-[14px] leading-[1.05] text-dashboard-text">
          {value}
          <small className="text-[12px]"> {unit}</small>
        </strong>
        {meta || badge ? (
          <div className="mt-[3px] flex min-h-[14px] items-center justify-between gap-2">
            {meta ? (
              <em className="inline-flex min-w-0 max-w-full items-center justify-start overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-1.5 text-[10px] not-italic leading-none text-[color-mix(in_srgb,currentColor_92%,white_8%)] [background:color-mix(in_srgb,currentColor_16%,rgba(8,12,18,0.92))] [border-color:color-mix(in_srgb,currentColor_24%,rgba(255,255,255,0.1))] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.04)]">
                {meta}
              </em>
            ) : (
              <span />
            )}
            {badge ? (
              <bdi className="inline-flex h-4 min-w-[36px] shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 px-1.5 text-[10px] font-bold leading-none text-[#edf6ef]">
                {badge}
              </bdi>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        aria-label={`Open ${label} details`}
        className={cn(
          'dashboard-glass-card absolute grid min-h-12 w-[136px] grid-cols-[10px_1fr] items-center gap-2.5 rounded-[9px] border px-2.5 py-2 text-left text-dashboard-text shadow-glass [text-shadow:0_1px_4px_rgba(0,0,0,0.6)] transition hover:brightness-105 focus-visible:brightness-105',
          toneClassName,
          className,
        )}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'dashboard-glass-card absolute grid min-h-12 w-[136px] grid-cols-[10px_1fr] items-center gap-2.5 rounded-[9px] border px-2.5 py-2 text-left text-dashboard-text shadow-glass [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]',
        toneClassName,
        className,
      )}
    >
      {content}
    </div>
  )
}

function FlowPath({
  color,
  d,
  reverse = false,
  state = 'active',
}: {
  color: string
  d: string
  reverse?: boolean
  state?: 'active' | 'idle'
}) {
  return (
    <g className="overview-flow-path" data-direction={reverse ? 'reverse' : 'forward'} data-state={state} style={{ color }}>
      <path className="flow-track" d={d} />
      <path className="flow-pulse" d={d} />
    </g>
  )
}
