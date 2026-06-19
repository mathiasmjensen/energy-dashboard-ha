const CACHE_KEY = 'energy-dashboard:evcc-charge-sessions:v1'

export type EvccChargeSession = {
  costDkk: string | null
  durationLabel: string
  endLabel: string | null
  energyKwh: string
  id: string
  startLabel: string
  startTs: number
  vehicle: string
}

export type ChargeSessionCache = {
  createdAt: number
  sessions: EvccChargeSession[]
}

export type EvccApiSession = {
  id: number
  created: string
  finished: string | null
  loadpoint?: string
  identifier?: string
  vehicle?: string
  odometer?: number
  meterStart?: number
  meterStop?: number
  chargedEnergy: number
  chargeDuration: number
  socStart?: number
  socEnd?: number
  solarPercentage?: number
  price?: number | null
  pricePerKWh?: number | null
  co2PerKWh?: number | null
  referencePricePerKWh?: number | null
  referenceCo2PerKWh?: number | null
}

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
