import type { DataStateBadgeModel } from './dataState'

export type InsightViewMode = 'timeline' | 'today'

export type InsightHeaderControls = {
  canGoNext: boolean
  canGoPrevious: boolean
  mode: InsightViewMode
  onNext: () => void
  onPrevious: () => void
  onToggleMode: () => void
}

export type InsightMetricItem = {
  label: string
  value: string
}

export type SolarForecastInsight = {
  dataState?: DataStateBadgeModel
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  summaryItems: InsightMetricItem[]
  totalKwh: string
  windowLabel: string
}

export type EnergyPriceInsight = {
  dataState?: DataStateBadgeModel
  pointLabels: string[]
  points: number[]
  primaryLabel: string
  primaryValue: string
  summaryItems: InsightMetricItem[]
  windowLabel: string
}
