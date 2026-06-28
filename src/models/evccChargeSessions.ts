export type EvccChargeSession = {
  costDkk: string | null
  durationLabel: string
  endLabel: string | null
  energyKwh: string
  id: string
  startLabel: string
  startTs: number
  vehicle: string
}

export type ChargeSessionCache = {
  createdAt: number
  sessions: EvccChargeSession[]
}

export type EvccApiSession = {
  id: number
  created: string
  finished: string | null
  loadpoint?: string
  identifier?: string
  vehicle?: string
  odometer?: number
  meterStart?: number
  meterStop?: number
  chargedEnergy: number
  chargeDuration: number
  socStart?: number
  socEnd?: number
  solarPercentage?: number
  price?: number | null
  pricePerKWh?: number | null
  co2PerKWh?: number | null
  referencePricePerKWh?: number | null
  referenceCo2PerKWh?: number | null
}
