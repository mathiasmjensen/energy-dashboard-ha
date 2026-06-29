import type {
  BatteryOptimizerMode,
  BatteryOptimizerPlanRow,
  BatteryOptimizerRecommendation,
  BatteryOptimizerSource,
} from '../models/batteryOptimizer'

export function formatOptimizerCurrency(value: number | null | undefined, suffix = 'DKK') {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '---'
  }

  return `${value.toFixed(2)} ${suffix}`
}

export function formatOptimizerPrice(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '---'
  }

  return `${value.toFixed(2)} DKK/kWh`
}

export function formatOptimizerEnergy(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '---'
  }

  return `${value.toFixed(1)} kWh`
}

export function formatOptimizerPower(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '---'
  }

  return `${Math.abs(value).toFixed(1)} kW`
}

export function formatOptimizerPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '---'
  }

  return `${Math.round(value)}%`
}

export function formatOptimizerUpdatedAt(iso: string | null | undefined) {
  if (!iso) {
    return 'No updates yet'
  }

  const parsedMs = Date.parse(iso)
  if (!Number.isFinite(parsedMs)) {
    return 'No updates yet'
  }

  return new Date(parsedMs).toLocaleString([], {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  })
}

export function formatOptimizerHourRange(row: BatteryOptimizerPlanRow) {
  return `${formatOptimizerClock(row.startIso)} - ${formatOptimizerClock(row.endIso)}`
}

export function formatOptimizerClock(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  })
}

export function getOptimizerRecommendationTone(recommendation: BatteryOptimizerRecommendation) {
  switch (recommendation) {
    case 'BUY':
      return 'blue' as const
    case 'CHARGE':
      return 'green' as const
    case 'DISCHARGE':
      return 'purple' as const
    case 'SELL':
      return 'gold' as const
    case 'HOLD':
      return 'neutral' as const
    default:
      return 'neutral' as const
  }
}

export function getOptimizerModeLabel(mode: BatteryOptimizerMode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

export function getOptimizerSourceLabel(source: BatteryOptimizerSource) {
  return source === 'mock' ? 'Mock data' : 'Live optimizer'
}
