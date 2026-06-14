type SparklineProps = {
  accent: 'cyan' | 'green' | 'yellow'
  points?: string
}

const DEFAULT_POINTS = '4,42 14,39 23,41 32,34 42,36 51,28 62,32 72,20 83,28 92,13 103,8 113,21 124,18'

export function Sparkline({ accent, points = DEFAULT_POINTS }: SparklineProps) {
  return (
    <svg className="sparkline" data-accent={accent} viewBox="0 0 128 52" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${accent}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`4,51 ${points} 124,51`} fill={`url(#spark-${accent})`} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}
