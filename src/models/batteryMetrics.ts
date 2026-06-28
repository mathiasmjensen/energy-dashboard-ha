export type BatteryEnergyRole = 'capacity' | 'stored'

export type BatteryEnergyMetrics = {
  capacityKwh: number | null
  storedEnergyKwh: number | null
}

export type BatteryTimeEstimate = {
  label: string
  value: string
}
