import type { ChargeSessionCache, EvccApiSession, EvccChargeSession } from '../models/evccChargeSessions'

const CACHE_KEY = 'energy-dashboard:evcc-charge-sessions:v1'

export function readEvccChargeSessionCache() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    const parsed = raw ? (JSON.parse(raw) as ChargeSessionCache) : null
    return parsed?.sessions ? parsed : null
  } catch {
    return null
  }
}

export function writeEvccChargeSessionCache(sessions: EvccChargeSession[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        sessions,
      } satisfies ChargeSessionCache),
    )
  } catch {
    // localStorage can be unavailable in hardened browsers.
  }
}

export function getEvccSessionsUrl() {
  const configured = getEnvValue('VITE_EVCC_SESSIONS_URL')?.trim()

  if (configured?.toLowerCase() === 'disabled') {
    return ''
  }

  if (configured) {
    return configured
  }

  const baseUrl = getEnvValue('VITE_EVCC_URL')?.trim()
  return baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/sessions` : ''
}

function getEnvValue(key: string) {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key]
}

export function getEvccSessionsFromAttributes(attributes: Record<string, unknown>, state?: string | null) {
  const payload = getFirstSessionPayload([
    attributes.sessions,
    attributes.items,
    attributes.data,
    attributes.value,
    state,
  ])

  return payload ? mapEvccSessions(payload as EvccApiSession[]) : []
}

export function mapEvccSessions(payload: EvccApiSession[]): EvccChargeSession[] {
  return payload
    .map((session) => {
      const startDate = new Date(session.created)
      const endDate = session.finished ? new Date(session.finished) : null
      const startTs = startDate.getTime()

      return {
        costDkk: session.price != null ? session.price.toFixed(2) : null,
        durationLabel: formatEvccDuration(session.chargeDuration),
        endLabel: formatTimeLabel(endDate),
        energyKwh: session.chargedEnergy > 0 ? session.chargedEnergy.toFixed(1) : '---',
        id: `${session.id}`,
        startLabel: formatDateLabel(startDate),
        startTs: Number.isFinite(startTs) ? startTs : Date.now(),
        vehicle: session.vehicle || session.loadpoint || 'EVCC session',
      } satisfies EvccChargeSession
    })
    .sort((left, right) => right.startTs - left.startTs)
}

function getFirstSessionPayload(values: unknown[]) {
  for (const value of values) {
    const parsedValue = typeof value === 'string' ? parseJson(value) : value

    if (Array.isArray(parsedValue)) {
      return parsedValue
    }

    if (parsedValue && typeof parsedValue === 'object') {
      const record = parsedValue as Record<string, unknown>
      const nested = record.sessions ?? record.items ?? record.data ?? record.value

      if (Array.isArray(nested)) {
        return nested
      }
    }
  }

  return null
}

function parseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function formatDateLabel(value: Date) {
  return value.toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  })
}

function formatTimeLabel(value: Date | null) {
  if (!value) {
    return null
  }

  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEvccDuration(nanoseconds: number) {
  const totalMinutes = Math.max(0, Math.round(nanoseconds / 1_000_000_000 / 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }

  return `${minutes}m`
}
