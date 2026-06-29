import type { DashboardMockData, MockEnergyDataPayload, MockHistoricalEnergyDayPayload, MockPeakRatesPayload, MockSolarForecastPayload } from '../models/dashboardMocks'
import type { PeakRateWindow } from '../models/peakRates'
import type { SolarForecastState, SolarForecastWindow } from '../models/solarForecast'
import type { TodayEnergyTotals } from '../models/todayEnergyTotals'
import energyDataJson from '../mock/energyData.json'
import historicalEnergyDayJson from '../mock/historicalEnergyDay.json'
import peakRatesJson from '../mock/peakRates.json'
import solarForecastJson from '../mock/solarForecast.json'
import todayEnergyTotalsJson from '../mock/todayEnergyTotals.json'

const ONE_HOUR_MS = 60 * 60 * 1000
const TWO_DAY_HOURS = 48

export function getDashboardMockData(now = new Date()): DashboardMockData {
  return {
    energyData: energyDataJson as MockEnergyDataPayload,
    historicalEnergyDay: historicalEnergyDayJson as MockHistoricalEnergyDayPayload,
    peakRateWindows: getDashboardMockPeakRateWindows(now),
    solarForecastState: getDashboardMockSolarForecastState(now),
    todayEnergyTotals: todayEnergyTotalsJson as TodayEnergyTotals,
  }
}

export function getDashboardMockPeakRateWindows(now = new Date()): PeakRateWindow[] {
  const { hourlyPricesDkk } = peakRatesJson as MockPeakRatesPayload
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return Array.from({ length: TWO_DAY_HOURS }, (_, index) => {
    const startMs = start.getTime() + index * ONE_HOUR_MS
    const endMs = startMs + ONE_HOUR_MS
    const dayOffsetFactor = index >= 24 ? 1.05 : 1
    const price = Number(((hourlyPricesDkk[index % hourlyPricesDkk.length] ?? 0) * dayOffsetFactor).toFixed(2))

    return { endMs, price, startMs }
  })
}

export function getDashboardMockSolarForecastState(now = new Date()): SolarForecastState {
  const payload = solarForecastJson as MockSolarForecastPayload
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayWindows = payload.hourlyPowerKw.map((powerKw, hour) => createSolarWindow(start.getTime(), hour, powerKw, 1))
  const tomorrowWindows = payload.hourlyPowerKw.map((powerKw, hour) => createSolarWindow(start.getTime() + 24 * ONE_HOUR_MS, hour, powerKw, 1.08))

  return {
    source: payload.source,
    windows: [...todayWindows, ...tomorrowWindows],
  }
}

export function isMissingDisplayValue(value: string | null | undefined) {
  if (!value) {
    return true
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '---' || normalized === 'weather' || normalized.startsWith('--- ')
}

export function pickDisplayValue(liveValue: string, mockValue: string) {
  return isMissingDisplayValue(liveValue) ? mockValue : liveValue
}

export function pickNumberValue(liveValue: number | null | undefined, mockValue: number) {
  return liveValue === null || liveValue === undefined || !Number.isFinite(liveValue) ? mockValue : liveValue
}

export function pickArrayValue<T>(liveValue: T[] | null | undefined, mockValue: T[]) {
  return Array.isArray(liveValue) && liveValue.length > 0 ? liveValue : mockValue
}

function createSolarWindow(startMs: number, hour: number, powerKw: number, factor: number): SolarForecastWindow {
  const hourStartMs = startMs + hour * ONE_HOUR_MS
  const normalizedPowerKw = Number((powerKw * factor).toFixed(2))

  return {
    endTime: new Date(hourStartMs + ONE_HOUR_MS).toISOString(),
    kwh: normalizedPowerKw,
    powerKw: normalizedPowerKw,
    time: new Date(hourStartMs).toISOString(),
  }
}
