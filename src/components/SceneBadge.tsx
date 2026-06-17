import { GlassPanel } from './GlassPanel'

type SceneBadgeProps = {
  accent: 'cyan' | 'green' | 'yellow'
  ariaLabel?: string
  className: string
  label: string
  onClick?: () => void
  unit: string
  value: string
}

export function SceneBadge({ accent, ariaLabel, className, label, onClick, unit, value }: SceneBadgeProps) {
  const content = (
    <>
      <div>
        <span>{value}</span>
        <small>{unit}</small>
      </div>
      <p>{label}</p>
    </>
  )

  if (onClick) {
    return (
      <button
        className={`glass-panel scene-badge scene-badge--button ${className}`}
        data-accent={accent}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <GlassPanel accent={accent} className={`scene-badge ${className}`}>
      {content}
    </GlassPanel>
  )
}
