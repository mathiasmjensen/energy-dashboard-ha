export type BatteryEnergyRole = 'capacity' | 'stored'

export type BatteryEnergyMetrics = {
  capacityKwh: number | null
  storedEnergyKwh: number | null
}

export type BatteryTimeEstimate = {
  label: string
  value: string
}

const CAPACITY_TERMS = ['capacity', 'total']
const STORED_ENERGY_TERMS = ['energy', 'remaining', 'stored']

export function inferBatteryEnergyRole(entityId?: string | null, friendlyName?: string | null): BatteryEnergyRole {
  const text = normalizeEntityText(`${entityId ?? ''} ${friendlyName ?? ''}`)

  if (CAPACITY_TERMS.some((term) => text.includes(term))) {
    return 'capacity'
  }

  if (STORED_ENERGY_TERMS.some((term) => text.includes(term))) {
    return 'stored'
  }

  return 'stored'
}

export function resolveBatteryEnergyMetrics({
  energyKwh,
  energyRole,
  socPercent,
}: {
  energyKwh: number | null
  energyRole: BatteryEnergyRole
  socPercent: number | null
}): BatteryEnergyMetrics {
  const socFraction = socPercent !== null && socPercent > 0 ? socPercent / 100 : null

  if (energyKwh === null) {
    return {
      capacityKwh: null,
      storedEnergyKwh: null,
    }
  }

  if (energyRole === 'capacity') {
    return {
      capacityKwh: energyKwh,
      storedEnergyKwh: socFraction === null ? null : energyKwh * socFraction,
    }
  }

  return {
    capacityKwh: socFraction === null ? null : energyKwh / socFraction,
    storedEnergyKwh: energyKwh,
  }
}

export function formatBatteryKwh(value: number | null) {
  return value === null ? '---' : value.toFixed(1)
}

export function getBatteryTimeEstimate({
  capacityKwh,
  powerKw,
  socPercent,
  status,
  storedEnergyKwh,
}: {
  capacityKwh: number | null
  powerKw: number | null
  socPercent: number
  status: string
  storedEnergyKwh: number | null
}): BatteryTimeEstimate {
  const normalizedStatus = status.toLowerCase()
  const normalizedPowerKw = powerKw ?? 0

  if (normalizedStatus === 'charging') {
    const remainingKwh =
      capacityKwh !== null && storedEnergyKwh !== null
        ? capacityKwh - storedEnergyKwh
        : capacityKwh === null
          ? null
          : (capacityKwh * (100 - socPercent)) / 100

    return {
      label: 'Time to full',
      value: remainingKwh === null || normalizedPowerKw <= 0.05 ? '---' : formatDurationHours(remainingKwh / normalizedPowerKw),
    }
  }

  if (normalizedStatus === 'discharging') {
    return {
      label: 'Time to empty',
      value:
        storedEnergyKwh === null || normalizedPowerKw <= 0.05
          ? '---'
          : formatDurationHours(storedEnergyKwh / normalizedPowerKw),
    }
  }

  return {
    label: 'Time estimate',
    value: '---',
  }
}

export function getBatteryRateMetrics({
  power,
  status,
}: {
  power: string
  status: string
}) {
  return {
    chargeRate: status === 'Charging' ? power : '0.0',
    dischargeRate: status === 'Discharging' ? power : '0.0',
  }
}

export function parseDisplayNumber(value: string) {
  if (value === '---') {
    return null
  }

  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeEntityText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

function formatDurationHours(hours: number) {
  if (!Number.isFinite(hours) || hours < 0) {
    return '---'
  }

  const totalMinutes = Math.round(hours * 60)

  if (totalMinutes < 1) {
    return '<1m'
  }

  const days = Math.floor(totalMinutes / 1440)
  const remainingMinutes = totalMinutes - days * 1440
  const wholeHours = Math.floor(remainingMinutes / 60)
  const minutes = remainingMinutes % 60

  if (days > 0) {
    return `${days}d ${wholeHours}h`
  }

  if (wholeHours > 0) {
    return `${wholeHours}h ${minutes}m`
  }

  return `${minutes}m`
}
