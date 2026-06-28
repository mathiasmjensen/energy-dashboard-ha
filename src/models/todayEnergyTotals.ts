export type HistoryRow = {
  attributes?: {
    unit_of_measurement?: string
  }
  entity_id?: string
  last_changed: string
  state: string
}

export type TodayEnergyTotals = {
  evKwh: string
  gridExportKwh: string
  gridKwh: string
  homeKwh: string
}

export type TodayEnergyTotalsCache = {
  createdAt: number
  totals: TodayEnergyTotals
}
