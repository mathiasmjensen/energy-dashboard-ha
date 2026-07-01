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
    <svg className="absolute left-[42px] top-[372px] h-[198px] w-[860px] overflow-visible" viewBox="0 0 860 198" aria-hidden="true">
      <FlowPath color="#f5a623" d="M204 32H300Q326 32 342 62" />
      <FlowPath color="#33d66b" d="M506 62Q522 24 566 24H674" reverse={batteryDirection === 'reverse'} />
      <FlowPath color="#a64df5" d="M204 130H300Q326 130 342 98" reverse={gridDirection === 'reverse'} />
      <FlowPath color="#a6adb6" d="M506 106Q520 160 566 160H674" state={evState} />
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
      <span className="mt-[6px] h-2.5 w-2.5 self-start rounded-full bg-current shadow-[0_0_14px_currentColor]" aria-hidden="true" />
      <div className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-current/90">{label}</span>
        <strong className="mt-1 block text-[20px] font-semibold leading-none text-dashboard-text">
          {value}
          <small className="text-[12px] font-semibold text-dashboard-soft"> {unit}</small>
        </strong>
        {meta || badge ? (
          <div className="mt-2 flex min-h-[18px] items-center justify-between gap-2">
            {meta ? (
              <em className="inline-flex min-w-0 max-w-full items-center justify-start overflow-hidden text-ellipsis whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium not-italic leading-none text-[color-mix(in_srgb,currentColor_90%,white_10%)] [background:color-mix(in_srgb,currentColor_14%,rgba(8,12,18,0.96))] [border-color:color-mix(in_srgb,currentColor_22%,rgba(255,255,255,0.12))] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.05)]">
                {meta}
              </em>
            ) : (
              <span />
            )}
            {badge ? (
              <bdi className="inline-flex h-5 min-w-[40px] shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 px-2 text-[10px] font-bold leading-none text-[#edf6ef]">
                {badge}
              </bdi>
            ) : null}
          </div>
        ) : null}
        {onClick ? (
          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Details
            <span aria-hidden="true">+</span>
          </span>
        ) : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        aria-label={`Open ${label} details`}
        className={cn(
          'dashboard-glass-card absolute grid min-h-[74px] w-[166px] cursor-pointer grid-cols-[12px_1fr] items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left text-dashboard-text shadow-[0_18px_42px_rgba(0,0,0,0.24)] [text-shadow:0_1px_4px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)] focus-visible:-translate-y-0.5 focus-visible:brightness-105',
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
        'dashboard-glass-card absolute grid min-h-[74px] w-[166px] grid-cols-[12px_1fr] items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left text-dashboard-text shadow-[0_18px_42px_rgba(0,0,0,0.24)] [text-shadow:0_1px_4px_rgba(0,0,0,0.55)]',
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
