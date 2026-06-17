import type { CSSProperties, ReactNode } from 'react'

type GlassPanelProps = {
  accent?: 'cyan' | 'green' | 'yellow'
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function GlassPanel({
  accent = 'cyan',
  children,
  className,
  style,
}: GlassPanelProps) {
  return (
    <section
      className={['glass-panel', className].filter(Boolean).join(' ')}
      data-accent={accent}
      style={style}
    >
      {children}
    </section>
  )
}
