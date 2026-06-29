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
  isMock: boolean
  maxPowerKw: string | null
  source: SolarForecastSource
  todayKwh: string | null
  tomorrowKwh: string | null
  windows: SolarForecastWindow[]
}
