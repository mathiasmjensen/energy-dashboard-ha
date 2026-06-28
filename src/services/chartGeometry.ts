import type { BarChartGeometry, ChartDomain, ChartUnit, DesktopLineChartGeometry, MobileLineChartGeometry } from '../models/chartGeometry'

export function getBarChartGeometry(values: number[]): BarChartGeometry {
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
        value,
      }
    }),
    isFlat: domain.isFlat,
    zeroY,
  }
}

export function getMobileLineChartGeometry(values: number[]): MobileLineChartGeometry {
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

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
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

export function getDesktopLineChartGeometry(values: number[]): DesktopLineChartGeometry {
  const normalizedValues = values.length ? values : [0]
  const domain = getChartDomain(normalizedValues)
  const width = 310
  const top = 12
  const bottom = 112
  const height = bottom - top
  const offsetY = 12
  const step = width / Math.max(1, normalizedValues.length)
  const zeroY = mapValueToY(0, domain.min, domain.max, top, height)
  const dots = normalizedValues.map((value, index) => ({
    x: Number((step * (index + 0.5)).toFixed(1)),
    y: Number(mapValueToY(value, domain.min, domain.max, offsetY, height).toFixed(1)),
  }))
  const firstPoint = dots[0] ?? { x: 0, y: zeroY }
  const lastPoint = dots[dots.length - 1] ?? firstPoint
  const linePoints = [{ x: 0, y: firstPoint.y }, ...dots, { x: width, y: lastPoint.y }]
  const line = linePoints.map((point) => `${point.x},${point.y}`).join(' ')
  const fill = `M0,${zeroY} L${line.replaceAll(' ', ' L')} L${width},${zeroY} `

  return { dots: dots.filter((_, index) => index % 3 === 0), fill, line, zeroY }
}

export function formatChartXAxisLabel(labels: string[] | undefined, index: number) {
  return labels?.[index] ?? formatChartHour(index)
}

export function formatChartHour(index: number) {
  return `${index.toString().padStart(2, '0')}:00`
}

export function formatChartValue(value: number, unit: ChartUnit) {
  const digits = unit === '%' ? 0 : 2
  return `${value.toFixed(digits)} ${unit}`
}

function getChartDomain(values: number[]): ChartDomain {
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
