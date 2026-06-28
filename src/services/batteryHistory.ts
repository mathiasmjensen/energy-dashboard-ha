export type BatteryHistoryPeriod = '24h' | '30d' | '7d' | '90d'

export type BatteryHistorySeries = {
  labels: string[]
  points: number[]
}

export type BatteryHistoryState = {
  changedMs: number
  value: number
}

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function getFallbackBatteryHistorySeries(socValue: number, period: BatteryHistoryPeriod): BatteryHistorySeries {
  const clampedSoc = clamp(socValue || 0, 0, 100)

  if (period === '24h') {
    return {
      labels: Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`),
      points: Array.from({ length: 24 }, (_, index) => clamp(clampedSoc - 10 + index * 0.95, 0, 100)),
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
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    points: Array.from({ length: 4 }, (_, index) => clamp(clampedSoc - 10 + index * 3.3, 0, 100)),
  }
}

export function normalizeBatteryHistoryStates(payload: unknown): BatteryHistoryState[] {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return []
  }

  return payload[0]
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const rawState = 'state' in item ? item.state : null
      const rawChanged = 'last_changed' in item ? item.last_changed : 'last_updated' in item ? item.last_updated : null
      const value = Number.parseFloat(String(rawState ?? '').replace(',', '.'))
      const changedMs = Date.parse(String(rawChanged ?? ''))

      if (!Number.isFinite(value) || !Number.isFinite(changedMs)) {
        return null
      }

      return {
        changedMs,
        value: clamp(value, 0, 100),
      } satisfies BatteryHistoryState
    })
    .filter((item): item is BatteryHistoryState => Boolean(item))
    .sort((left, right) => left.changedMs - right.changedMs)
}

export function buildBatteryHistorySeriesFromStates(
  states: BatteryHistoryState[],
  period: BatteryHistoryPeriod,
  nowMs: number,
  fallbackSocValue: number,
): BatteryHistorySeries {
  if (!states.length) {
    return getFallbackBatteryHistorySeries(fallbackSocValue, period)
  }

  if (period === '24h') {
    const startMs = nowMs - 23 * HOUR_MS
    return buildBucketSeries({
      bucketCount: 24,
      bucketMs: HOUR_MS,
      fallbackValue: fallbackSocValue,
      formatLabel: (timestamp) => formatHourLabel(timestamp),
      startMs,
      states,
    })
  }

  if (period === '7d') {
    const startMs = startOfLocalDay(nowMs) - 6 * DAY_MS
    return buildBucketSeries({
      bucketCount: 7,
      bucketMs: DAY_MS,
      fallbackValue: fallbackSocValue,
      formatLabel: (timestamp) => formatWeekdayLabel(timestamp),
      startMs,
      states,
    })
  }

  if (period === '30d') {
    const startMs = startOfLocalDay(nowMs) - 29 * DAY_MS
    return buildBucketSeries({
      bucketCount: 30,
      bucketMs: DAY_MS,
      fallbackValue: fallbackSocValue,
      formatLabel: (timestamp, index) => (index % 5 === 0 ? formatMonthDayLabel(timestamp) : ''),
      startMs,
      states,
    })
  }

  const startMs = startOfLocalDay(nowMs) - 84 * DAY_MS
  return buildBucketSeries({
    bucketCount: 13,
    bucketMs: 7 * DAY_MS,
    fallbackValue: fallbackSocValue,
    formatLabel: (timestamp) => formatMonthDayLabel(timestamp),
    startMs,
    states,
  })
}

function buildBucketSeries({
  bucketCount,
  bucketMs,
  fallbackValue,
  formatLabel,
  startMs,
  states,
}: {
  bucketCount: number
  bucketMs: number
  fallbackValue: number
  formatLabel: (timestamp: number, index: number) => string
  startMs: number
  states: BatteryHistoryState[]
}) {
  const labels: string[] = []
  const points: number[] = []
  let cursor = 0
  let latestValue = states[0]?.value ?? fallbackValue

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketStartMs = startMs + index * bucketMs
    const bucketEndMs = bucketStartMs + bucketMs

    while (cursor < states.length && states[cursor].changedMs < bucketEndMs) {
      latestValue = states[cursor].value
      cursor += 1
    }

    labels.push(formatLabel(bucketStartMs, index))
    points.push(round(latestValue))
  }

  return {
    labels,
    points,
  }
}

function formatHourLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', hour12: false })
}

function formatWeekdayLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], { weekday: 'short' })
}

function formatMonthDayLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function round(value: number) {
  return Number(value.toFixed(1))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
