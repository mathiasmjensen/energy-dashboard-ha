import type { BatteryPeriod, MobileDashboardProps } from './MobileTypes'
import { getBatteryRateMetrics, getBatteryTimeEstimate, parseDisplayNumber } from '../../services/batteryMetrics'
import { getBarChartGeometry } from '../../services/chartGeometry'

export function normalizeSeries(values: number[]) {
  return getBarChartGeometry(values).bars.map((bar) => bar.height)
}

export function getBatteryHistorySeries(socValue: number, period: BatteryPeriod) {
  const clampedSoc = clamp(socValue || 0, 0, 100)

  if (period === 'Day') {
    return {
      labels: Array.from({ length: 13 }, (_, index) => `${String(index * 2).padStart(2, '0')}:00`),
      points: Array.from({ length: 13 }, (_, index) => clamp(clampedSoc - 8 + index * 1.1, 0, 100)),
    }
  }

  if (period === 'Week') {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      points: Array.from({ length: 7 }, (_, index) => clamp(clampedSoc - 6 + index * 1.8, 0, 100)),
    }
  }

  return {
    labels: ['W1', 'W2', 'W3', 'W4'],
    points: Array.from({ length: 4 }, (_, index) => clamp(clampedSoc - 5 + index * 2.2, 0, 100)),
  }
}

export function getBatteryInsights(battery: MobileDashboardProps['battery']) {
  const rates = getBatteryRateMetrics({
    power: battery.power,
    status: battery.status,
  })
  const runtime = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(battery.capacity),
    powerKw: parseDisplayNumber(battery.power),
    socPercent: battery.socValue,
    status: battery.status,
    storedEnergyKwh: parseDisplayNumber(battery.energy),
  })

  return {
    chargeRate: rates.chargeRate,
    dischargeRate: rates.dischargeRate,
    runtimeLabel: runtime.label,
    runtimeValue: runtime.value,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
