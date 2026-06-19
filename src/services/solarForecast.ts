const DEFAULT_LATITUDE = 55.493
const DEFAULT_LONGITUDE = 10.2046
const DEFAULT_TILT = 30
const DEFAULT_AZIMUTH = 0
const DEFAULT_PANEL_CAPACITY_KW = 10
const DEFAULT_TIMEZONE = 'Europe/Copenhagen'
const EVCC_SOLAR_CACHE_KEY = 'energy-dashboard:evcc-solar-forecast:v1'

export type SolarForecastWindow = {
  endTime: string
  time: string
  kwh: number
  powerKw: number
}

export type SolarForecastSource = 'evcc' | 'open-meteo'

export type OpenMeteoPayload = {
  hourly?: {
    global_tilted_irradiance?: Array<number | null>
    time?: string[]
  }
}

export type EvccSolarPayload = {
  rates?: Array<{
    end?: string
    start?: string
    value?: number
  }>
}

export type EvccSolarCache = {
  createdAt: number
  windows: SolarForecastWindow[]
}

export type SolarForecastState = {
  source: SolarForecastSource
  windows: SolarForecastWindow[]
}

export type SolarForecastResult = {
  currentPowerKw: string | null
  hourlyKwh: number[]
  hourlyPowerKw: number[]
  maxPowerKw: string | null
  source: SolarForecastSource
  todayKwh: string | null
  tomorrowKwh: string | null
  windows: SolarForecastWindow[]
}

export function getSolarForecastUrl() {
  const configured = getEnvValue('VITE_SOLAR_FORECAST_URL')?.trim()

  if (configured?.toLowerCase() === 'disabled') {
    return ''
  }

  if (configured) {
    return configured
  }

  const params = new URLSearchParams({
    azimuth: String(getEnvNumber('VITE_SOLAR_FORECAST_AZIMUTH', DEFAULT_AZIMUTH)),
    forecast_days: '2',
    hourly: 'global_tilted_irradiance',
    latitude: String(getEnvNumber('VITE_SOLAR_FORECAST_LATITUDE', DEFAULT_LATITUDE)),
    longitude: String(getEnvNumber('VITE_SOLAR_FORECAST_LONGITUDE', DEFAULT_LONGITUDE)),
    tilt: String(getEnvNumber('VITE_SOLAR_FORECAST_TILT', DEFAULT_TILT)),
    timezone: getEnvValue('VITE_SOLAR_FORECAST_TIMEZONE')?.trim() || DEFAULT_TIMEZONE,
  })

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`
}

export function getEvccSolarForecastUrl() {
  const configured = getEnvValue('VITE_EVCC_SOLAR_FORECAST_URL')?.trim()

  if (configured?.toLowerCase() === 'disabled') {
    return ''
  }

  if (configured) {
    return configured
  }

  const baseUrl = getEnvValue('VITE_EVCC_URL')?.trim()
  if (!baseUrl) {
    return ''
  }

  return `${baseUrl.replace(/\/$/, '')}/api/tariff/solar`
}

export function getPanelCapacityKw() {
  return getEnvNumber('VITE_SOLAR_PANEL_CAPACITY_KW', DEFAULT_PANEL_CAPACITY_KW)
}

export function normalizeForecast(payload: OpenMeteoPayload, panelCapacityKw: number) {
  const times = payload.hourly?.time ?? []
  const irradiance = payload.hourly?.global_tilted_irradiance ?? []
  const length = Math.min(times.length, irradiance.length)
  const windows: SolarForecastWindow[] = []

  for (let index = 0; index < length; index += 1) {
    const value = irradiance[index]

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      continue
    }

    windows.push({
      endTime: addHours(times[index], 1),
      kwh: Math.max(0, (value / 1000) * panelCapacityKw),
      powerKw: Math.max(0, (value / 1000) * panelCapacityKw),
      time: times[index],
    })
  }

  return windows
}

export function normalizeEvccForecast(payload: EvccSolarPayload) {
  const rates = payload.rates ?? []
  const windows: SolarForecastWindow[] = []

  for (const rate of rates) {
    const startMs = Date.parse(String(rate.start))
    const endMs = Date.parse(String(rate.end))
    const value = Number(rate.value)

    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs || !Number.isFinite(value)) {
      continue
    }

    const hours = (endMs - startMs) / 3_600_000
    const powerKw = Math.max(0, value) / 1000

    windows.push({
      endTime: String(rate.end),
      kwh: powerKw * hours,
      powerKw,
      time: String(rate.start),
    })
  }

  return windows
}

export function getSolarForecastStateFromAttributes(
  attributes: Record<string, unknown>,
  state: string | null | undefined,
  panelCapacityKw: number,
): SolarForecastState {
  const payload = getFirstSolarPayload([
    attributes.rates,
    attributes.forecast,
    attributes.windows,
    attributes.data,
    attributes.hourly,
    state,
  ])

  if (!payload) {
    return { source: 'open-meteo', windows: [] }
  }

  const evccWindows = normalizeEvccForecast(payload as EvccSolarPayload)
  if (evccWindows.length) {
    return { source: 'evcc', windows: evccWindows }
  }

  const openMeteoPayload =
    payload && typeof payload === 'object' && 'hourly' in payload
      ? (payload as OpenMeteoPayload)
      : ({ hourly: payload } as OpenMeteoPayload)
  const openMeteoWindows = normalizeForecast(openMeteoPayload, panelCapacityKw)

  return { source: 'open-meteo', windows: openMeteoWindows }
}

export function readEvccSolarCache() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawCache = window.localStorage.getItem(EVCC_SOLAR_CACHE_KEY)
    const cache = rawCache ? (JSON.parse(rawCache) as EvccSolarCache) : null

    if (!cache || !Array.isArray(cache.windows)) {
      return null
    }

    return cache
  } catch {
    return null
  }
}

export function writeEvccSolarCache(windows: SolarForecastWindow[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      EVCC_SOLAR_CACHE_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        windows,
      } satisfies EvccSolarCache),
    )
  } catch {
    // localStorage may be disabled in hardened browsers; fetching still works.
  }
}

export function getInitialSolarForecastState(evccForecastUrl: string): SolarForecastState {
  const cached = evccForecastUrl ? readEvccSolarCache() : null

  if (cached?.windows.length) {
    return {
      source: 'evcc',
      windows: cached.windows,
    }
  }

  return {
    source: 'open-meteo',
    windows: [],
  }
}

export function getForecastResult(
  windows: SolarForecastWindow[],
  source: SolarForecastSource,
  nowMs = Date.now(),
): SolarForecastResult {
  const todayKey = getLocalDateKey(new Date(nowMs))
  const tomorrowKey = getLocalDateKey(nowMs + 24 * 60 * 60 * 1000)
  const todayWindows = windows.filter((window) => getLocalDateKey(window.time) === todayKey)
  const hourlyKwh = Array.from({ length: 24 }, (_, hour) => {
    return todayWindows
      .filter((candidate) => new Date(candidate.time).getHours() === hour)
      .reduce((sum, window) => sum + window.kwh, 0)
  })
  const hourlyPowerKw = Array.from({ length: 24 }, (_, hour) => {
    const hourWindows = todayWindows.filter((candidate) => new Date(candidate.time).getHours() === hour)
    const durationHours = hourWindows.reduce((sum, window) => {
      const startMs = Date.parse(window.time)
      const endMs = Date.parse(window.endTime)
      return sum + Math.max(0, endMs - startMs) / 3_600_000
    }, 0)

    if (durationHours <= 0) {
      return 0
    }

    const kwh = hourWindows.reduce((sum, window) => sum + window.kwh, 0)
    return Number((kwh / durationHours).toFixed(2))
  })
  const todayKwh = source === 'evcc' ? sumRemainingDay(windows, todayKey, nowMs) : sumDay(windows, todayKey)
  const activeWindow =
    windows.find((window) => Date.parse(window.time) <= nowMs && nowMs < Date.parse(window.endTime)) ??
    todayWindows.findLast((window) => Date.parse(window.time) <= nowMs)
  const maxPowerKw = todayWindows.reduce((max, window) => Math.max(max, window.powerKw), 0)

  return {
    currentPowerKw: formatKw(activeWindow?.powerKw ?? 0, source === 'evcc'),
    hourlyKwh,
    hourlyPowerKw,
    maxPowerKw: formatKw(maxPowerKw, source === 'evcc'),
    source,
    todayKwh: formatKwh(todayKwh, source === 'evcc'),
    tomorrowKwh: formatKwh(sumDay(windows, tomorrowKey), source === 'evcc'),
    windows,
  }
}

function getEnvNumber(key: string, fallback: number) {
  const rawValue = getEnvValue(key)?.trim()
  const value = Number.parseFloat(rawValue ?? '')

  return Number.isFinite(value) ? value : fallback
}

function getEnvValue(key: string) {
  return (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key]
}

function getFirstSolarPayload(values: unknown[]) {
  for (const value of values) {
    const parsedValue = typeof value === 'string' ? parseJson(value) : value

    if (parsedValue && typeof parsedValue === 'object') {
      if (Array.isArray(parsedValue)) {
        return { rates: parsedValue }
      }

      return parsedValue
    }
  }

  return null
}

function parseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function getLocalDateKey(value: string | number | Date) {
  const date = typeof value === 'string' ? new Date(value) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sumDay(windows: SolarForecastWindow[], dayKey: string) {
  return windows
    .filter((window) => getLocalDateKey(window.time) === dayKey)
    .reduce((sum, window) => sum + window.kwh, 0)
}

function sumRemainingDay(windows: SolarForecastWindow[], dayKey: string, nowMs: number) {
  return windows
    .filter((window) => getLocalDateKey(window.time) === dayKey && Date.parse(window.time) >= nowMs)
    .reduce((sum, window) => sum + window.kwh, 0)
}

function formatKwh(value: number, showZero = false) {
  return value > 0 || showZero ? value.toFixed(1) : null
}

function formatKw(value: number, showZero = false) {
  return value > 0 || showZero ? value.toFixed(1) : null
}

function addHours(value: string, hours: number) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  date.setHours(date.getHours() + hours)
  return date.toISOString()
}
