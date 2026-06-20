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
    <svg className="overview-flow-map" viewBox="0 0 846 158" aria-hidden="true">
      <FlowPath className="line-solar" d="M186 28H300Q330 28 348 58" />
      <FlowPath className="line-home-battery" d="M484 58Q508 28 548 28H648" reverse={batteryDirection === 'reverse'} />
      <FlowPath className="line-grid" d="M186 112H300Q330 112 348 86" reverse={gridDirection === 'reverse'} />
      <FlowPath className="line-ev" d="M484 86Q508 112 548 112H648" state={evState} />
    </svg>
  )
}

export function FlowNode({
  className,
  label,
  meta,
  onClick,
  tone,
  unit,
  value,
}: {
  className: string
  label: string
  meta?: string
  onClick?: () => void
  tone: 'blue' | 'green' | 'muted' | 'purple' | 'sun'
  unit: string
  value: string
}) {
  const content = (
    <>
      <span className="flow-node-dot" aria-hidden="true" />
      <div className="flow-node-label">
        <span>{label}</span>
        <strong>
          {value}
          <small> {unit}</small>
        </strong>
        {meta ? <em>{meta}</em> : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        aria-label={`Open ${label} details`}
        className={`flow-node-card flow-node-card--interactive ${className}`}
        data-tone={tone}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={`flow-node-card ${className}`} data-tone={tone}>
      {content}
    </div>
  )
}

function FlowPath({
  className,
  d,
  reverse = false,
  state = 'active',
}: {
  className: string
  d: string
  reverse?: boolean
  state?: 'active' | 'idle'
}) {
  return (
    <g className={`overview-flow-path ${className}`} data-direction={reverse ? 'reverse' : 'forward'} data-state={state}>
      <path className="flow-track" d={d} />
      <path className="flow-pulse" d={d} />
    </g>
  )
}
