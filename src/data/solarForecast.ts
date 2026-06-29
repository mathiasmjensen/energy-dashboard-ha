import type { SolarForecastConfig, SolarForecastHour, SolarForecastSummary } from '../models/solarForecastData'

const SOLAR_FORECAST_VARIABLE = 'global_tilted_irradiance'

export const DEFAULT_SOLAR_FORECAST_CONFIG: SolarForecastConfig = {
  azimuth: 0,
  capacityKw: 10,
  forecastDays: 2,
  latitude: 55.493,
  longitude: 10.2046,
  tilt: 30,
  timezone: 'Europe/Copenhagen',
}

function getDateKey(date: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      timeZone: timezone,
      year: 'numeric',
    }).formatToParts(date)
    const year = parts.find((part) => part.type === 'year')?.value
    const month = parts.find((part) => part.type === 'month')?.value
    const day = parts.find((part) => part.type === 'day')?.value

    if (year && month && day) {
      return `${year}-${month}-${day}`
    }
  } catch {
    // Fall through to UTC when the configured timezone is invalid.
  }

  return date.toISOString().slice(0, 10)
}

function getForecastDateKey(value: unknown, timezone: string) {
  if (typeof value !== 'string') {
    return null
  }

  const localDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]

  if (localDate) {
    return localDate
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return getDateKey(parsed, timezone)
}

function getPositiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'))

  if (!Number.isFinite(number)) {
    return null
  }

  return Math.max(0, number)
}

export function buildOpenMeteoSolarForecastUrl(config: SolarForecastConfig) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')

  url.searchParams.set('latitude', String(config.latitude))
  url.searchParams.set('longitude', String(config.longitude))
  url.searchParams.set('hourly', SOLAR_FORECAST_VARIABLE)
  url.searchParams.set('timezone', config.timezone)
  url.searchParams.set('forecast_days', String(config.forecastDays))
  url.searchParams.set('tilt', String(config.tilt))
  url.searchParams.set('azimuth', String(config.azimuth))

  return url.toString()
}

export function normalizeSolarForecast(payload: unknown, config: SolarForecastConfig, now = new Date()): SolarForecastSummary {
  if (!payload || typeof payload !== 'object') {
    return { bars: [], hourlyToday: [], todayKwh: null }
  }

  const hourly = (payload as { hourly?: Record<string, unknown> }).hourly
  const times = hourly?.time
  const irradianceValues = hourly?.[SOLAR_FORECAST_VARIABLE]

  if (!Array.isArray(times) || !Array.isArray(irradianceValues)) {
    return { bars: [], hourlyToday: [], todayKwh: null }
  }

  const todayKey = getDateKey(now, config.timezone)
  const hourlyToday: SolarForecastHour[] = []
  const rowCount = Math.min(times.length, irradianceValues.length)

  for (let index = 0; index < rowCount; index += 1) {
    if (getForecastDateKey(times[index], config.timezone) !== todayKey) {
      continue
    }

    const irradianceWm2 = getPositiveNumber(irradianceValues[index])

    if (irradianceWm2 === null) {
      continue
    }

    hourlyToday.push({
      energyKwh: (irradianceWm2 / 1000) * config.capacityKw,
      irradianceWm2,
      time: String(times[index]),
    })
  }

  if (!hourlyToday.length) {
    return { bars: [], hourlyToday, todayKwh: null }
  }

  const todayKwh = hourlyToday.reduce((total, hour) => total + hour.energyKwh, 0)
  const peakHourKwh = Math.max(...hourlyToday.map((hour) => hour.energyKwh))
  const bars =
    peakHourKwh > 0
      ? hourlyToday.map((hour) => Math.max(3, Math.round((hour.energyKwh / peakHourKwh) * 100)))
      : hourlyToday.map(() => 3)

  return {
    bars,
    hourlyToday,
    todayKwh,
  }
}
