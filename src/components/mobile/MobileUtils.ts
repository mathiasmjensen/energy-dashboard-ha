import type { BatteryPeriod, MobileDashboardProps } from './MobileTypes'

export function normalizeSeries(values: number[]) {
  return getBarGeometry(values).bars.map((bar) => bar.height)
}

export function getChartGeometry(values: number[]) {
  const normalizedValues = values.length ? values : [0]
  const domain = getChartDomain(normalizedValues)
  const chartTop = 16
  const chartBottom = 124
  const chartHeight = chartBottom - chartTop
  const left = 12
  const right = 308
  const zeroY = mapValueToY(0, domain.min, domain.max, chartTop, chartHeight)
  const step = normalizedValues.length > 1 ? (right - left) / (normalizedValues.length - 1) : 0

  const points = normalizedValues.map((value, index) => ({
    x: Number((left + step * index).toFixed(2)),
    y: Number(mapValueToY(value, domain.min, domain.max, chartTop, chartHeight).toFixed(2)),
  }))

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const fillPath = `${linePath} L ${right} ${zeroY} L ${left} ${zeroY} Z`

  return {
    dots: points.filter((_, index) => index % 3 === 0 || index === points.length - 1),
    fillPath,
    isFlat: domain.isFlat,
    linePath,
    maxLabel: domain.max,
    minLabel: domain.min,
    zeroY,
  }
}

export function getBarGeometry(values: number[]) {
  const normalizedValues = values.length ? values : [0]
  const domain = getChartDomain(normalizedValues)
  const zeroY = valueToPercent(0, domain.min, domain.max)

  return {
    bars: normalizedValues.map((value) => {
      const y = valueToPercent(value, domain.min, domain.max)
      const top = Math.min(y, zeroY)
      const rawHeight = Math.abs(zeroY - y)

      return {
        height: Math.max(rawHeight, value === 0 ? 1.5 : 3),
        isNegative: value < 0,
        top,
      }
    }),
    isFlat: domain.isFlat,
    zeroY,
  }
}

function getChartDomain(values: number[]) {
  const finiteValues = values.filter(Number.isFinite)
  const actualMin = Math.min(...finiteValues, 0)
  const actualMax = Math.max(...finiteValues, 0)
  const isFlat = actualMin === actualMax

  if (isFlat) {
    const pad = Math.max(Math.abs(actualMax) * 0.35, 1)
    return {
      isFlat,
      max: actualMax + pad,
      min: actualMin - pad,
    }
  }

  const range = actualMax - actualMin
  const pad = Math.max(range * 0.12, 0.15)

  return {
    isFlat,
    max: actualMax + pad,
    min: actualMin - pad,
  }
}

function mapValueToY(value: number, min: number, max: number, top: number, height: number) {
  return top + (1 - (value - min) / (max - min)) * height
}

function valueToPercent(value: number, min: number, max: number) {
  return (1 - (value - min) / (max - min)) * 100
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
  const power = parseNumber(battery.power)
  const storedEnergy = parseNumber(battery.energy)
  const soc = clamp(battery.socValue || 0, 0, 100)
  const totalCapacity = soc > 0 && storedEnergy !== null ? storedEnergy / (soc / 100) : null
  const charging = battery.status === 'Charging'
  const discharging = battery.status === 'Discharging'
  const normalizedPower = power ?? 0
  const chargeRate = charging ? battery.power : '0.0'
  const dischargeRate = discharging ? battery.power : '0.0'

  let runtimeLabel = 'Estimated runtime'
  let runtimeValue = '---'

  if (charging && totalCapacity !== null && storedEnergy !== null && normalizedPower > 0) {
    runtimeLabel = 'Time to full'
    runtimeValue = formatDuration((totalCapacity - storedEnergy) / normalizedPower)
  } else if (discharging && storedEnergy !== null && normalizedPower > 0) {
    runtimeLabel = 'Time to empty'
    runtimeValue = formatDuration(storedEnergy / normalizedPower)
  }

  return {
    chargeRate,
    dischargeRate,
    runtimeLabel,
    runtimeValue,
  }
}

export function formatChartValue(value: number, unit: '%' | 'DKK/kWh' | 'kW' | 'kWh') {
  const digits = unit === '%' ? 0 : 2
  return `${value.toFixed(digits)} ${unit}`
}

function formatDuration(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) {
    return '---'
  }

  const totalMinutes = Math.round(hours * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${wholeHours}h ${String(minutes).padStart(2, '0')} min`
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
