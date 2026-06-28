import type { SolarProductionPoint } from '../models/solarProduction'

export function getSolarProductionCurveFromAttributes(attributes: Record<string, unknown>, state?: string | null) {
  const payload = getSolarProductionPayload(attributes, state)
  const points = normalizeSolarProductionPoints(payload)

  if (!points.length) {
    return {
      available: false,
      labels: Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, '0')}:00`),
      values: Array.from({ length: 24 }, () => 0),
    }
  }

  const values = Array.from({ length: 24 }, () => 0)
  const labels = Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, '0')}:00`)

  for (const point of points) {
    if (point.hour >= 0 && point.hour < 24) {
      values[point.hour] = Number(point.value.toFixed(2))
      labels[point.hour] = point.label
    }
  }

  return {
    available: true,
    labels,
    values,
  }
}

function getSolarProductionPayload(attributes: Record<string, unknown>, state?: string | null) {
  return (
    attributes.hourly_solar_production ??
    attributes.hourly ??
    attributes.values ??
    attributes.data ??
    parseMaybeJson(state)
  )
}

function normalizeSolarProductionPoints(payload: unknown): SolarProductionPoint[] {
  if (!Array.isArray(payload)) {
    return []
  }

  if (payload.every((item) => typeof item === 'number')) {
    return payload.slice(0, 24).map((value, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      value: Number(value),
    }))
  }

  return payload
    .map((item, index) => normalizeSolarProductionPoint(item, index))
    .filter((point): point is SolarProductionPoint => point !== null)
}

function normalizeSolarProductionPoint(payload: unknown, index: number): SolarProductionPoint | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>
  const label = String(record.label ?? record.time ?? record.hour ?? `${index.toString().padStart(2, '0')}:00`)
  const value = parseNumber(record.value ?? record.kwh ?? record.energy ?? record.production ?? record.generation)
  const hour = extractHour(record.hour ?? record.time ?? label, index)

  if (value === null || hour === null) {
    return null
  }

  return {
    hour,
    label: label.includes(':') ? label.slice(0, 5) : `${hour.toString().padStart(2, '0')}:00`,
    value,
  }
}

function extractHour(value: unknown, fallbackIndex: number) {
  if (typeof value === 'number' && value >= 0 && value < 24) {
    return Math.floor(value)
  }

  if (typeof value === 'string') {
    const match = value.match(/(\d{1,2}):\d{2}/)
    if (match) {
      const parsed = Number.parseInt(match[1], 10)
      return Number.isFinite(parsed) && parsed >= 0 && parsed < 24 ? parsed : null
    }

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.getHours()
    }
  }

  return fallbackIndex >= 0 && fallbackIndex < 24 ? fallbackIndex : null
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function parseMaybeJson(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
