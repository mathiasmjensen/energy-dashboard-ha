export type ChartUnit = '%' | 'DKK/kWh' | 'kW' | 'kWh'

export type BarChartGeometry = {
  bars: Array<{
    height: number
    isNegative: boolean
    top: number
    value: number
  }>
  isFlat: boolean
  zeroY: number
}

export type MobileLineChartGeometry = {
  dots: Array<{ x: number; y: number }>
  fillPath: string
  isFlat: boolean
  linePath: string
  maxLabel: number
  minLabel: number
  zeroY: number
}

export type DesktopLineChartGeometry = {
  dots: Array<{ x: number; y: number }>
  fill: string
  line: string
  zeroY: number
}

export type ChartDomain = {
  isFlat: boolean
  max: number
  min: number
}
