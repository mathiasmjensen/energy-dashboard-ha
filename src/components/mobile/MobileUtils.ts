import type { MobileDashboardProps } from './MobileTypes'
import { getBatteryRateMetrics, getBatteryTimeEstimate, parseDisplayNumber } from '../../services/batteryMetrics'
import { getBarChartGeometry } from '../../services/chartGeometry'

export function normalizeSeries(values: number[]) {
  return getBarChartGeometry(values).bars.map((bar) => bar.height)
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
