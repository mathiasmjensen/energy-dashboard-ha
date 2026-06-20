export type BatteryHistoryPeriod = '24h' | '30d' | '7d' | '90d'

export function getBatteryHistorySeries(socValue: number, period: BatteryHistoryPeriod) {
  const clampedSoc = clamp(socValue || 0, 0, 100)

  if (period === '24h') {
    return {
      labels: Array.from({ length: 13 }, (_, index) => `${String(index * 2).padStart(2, '0')}:00`),
      points: Array.from({ length: 13 }, (_, index) => clamp(clampedSoc - 8 + index * 1.1, 0, 100)),
    }
  }

  if (period === '7d') {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      points: Array.from({ length: 7 }, (_, index) => clamp(clampedSoc - 6 + index * 1.8, 0, 100)),
    }
  }

  if (period === '30d') {
    return {
      labels: ['W1', 'W2', 'W3', 'W4'],
      points: Array.from({ length: 4 }, (_, index) => clamp(clampedSoc - 5 + index * 2.2, 0, 100)),
    }
  }

  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    points: Array.from({ length: 4 }, (_, index) => clamp(clampedSoc - 10 + index * 3.3, 0, 100)),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
