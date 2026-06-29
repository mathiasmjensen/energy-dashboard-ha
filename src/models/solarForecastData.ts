export type SolarForecastConfig = {
  azimuth: number
  capacityKw: number
  forecastDays: number
  latitude: number
  longitude: number
  tilt: number
  timezone: string
}

export type SolarForecastHour = {
  energyKwh: number
  irradianceWm2: number
  time: string
}

export type SolarForecastSummary = {
  bars: number[]
  hourlyToday: SolarForecastHour[]
  todayKwh: number | null
}
