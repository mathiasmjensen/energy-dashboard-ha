import { useMemo } from 'react'
import { useHass } from '@hakit/core'
import { ENERGY_ENTITY_NUMERIC_SCALE, type EnergyEntityKey } from '../data/energyEntities'
import { resolveEnergyEntities, type ResolvedEnergyEntities } from '../data/resolveEnergyEntities'
import type { EvccSchedulePlan } from '../data/evcc'

type Unit = 'A' | 'kW' | 'kWh' | '%' | 'kg' | 'price' | 'text' | 'KM'

const DASH = '---'
const UNKNOWN_STATES = new Set(['unknown', 'unavailable', 'none', 'null', ''])
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getResolvedEntity(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  return resolved[key]?.entity
}

function getEntityState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const entity = getResolvedEntity(resolved, key)
  const state = entity?.state?.trim()

  if (!state || UNKNOWN_STATES.has(state.toLowerCase())) {
    return null
  }

  return state
}

function getNumericState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const state = getEntityState(resolved, key)
  if (!state) {
    return null
  }

  const value = Number.parseFloat(state.replace(',', '.'))
  if (!Number.isFinite(value)) {
    return null
  }

  return value * (ENERGY_ENTITY_NUMERIC_SCALE[key] ?? 1)
}

function getEntityOptions(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const options = getResolvedEntity(resolved, key)?.attributes.options

  if (!Array.isArray(options)) {
    return []
  }

  return options.map(String)
}

function getRawEntityState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const entity = getResolvedEntity(resolved, key)
  return entity?.state ?? null
}

function getEntityAttribute(resolved: ResolvedEnergyEntities, key: EnergyEntityKey, attribute: string) {
  return getResolvedEntity(resolved, key)?.attributes[attribute]
}

function formatNumber(value: number | null, unit: Unit): string {
  if (value === null) {
    return DASH
  }

  switch (unit) {
    case 'A':
      return Math.round(value).toString()
    case 'kW':
      return Math.abs(value).toFixed(1)
    case 'kWh':
      return value.toFixed(1)
    case '%':
    case 'kg':
      return Math.round(value).toString()
    case 'price':
      return value.toFixed(2)
    case 'text':
      return value.toString()
    default:
      return DASH
  }
}

function formatPlanTime(resolved: ResolvedEnergyEntities, key: EnergyEntityKey, fallback: string) {
  const state = getEntityState(resolved, key)

  if (!state) {
    return fallback
  }

  if (/^\d{2}:\d{2}/.test(state)) {
    return state.slice(0, 5)
  }

  return fallback
}

function formatPlanEnabled(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const state = getEntityState(resolved, key)

  return state?.toLowerCase() === 'on'
}

function formatState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey, unit: Unit): string {
  if (unit === 'text') {
    return getEntityState(resolved, key) ?? DASH
  }

  return formatNumber(getNumericState(resolved, key), unit)
}

function formatBatteryStatus(value: number | null) {
  if (value === null || Math.abs(value) < 0.05) {
    return 'Idle'
  }

  return value > 0 ? 'Discharging' : 'Charging'
}

function formatChargingStatus(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const state = getEntityState(resolved, key)

  if (state === null) {
    return DASH
  }

  const normalized = state.toLowerCase()

  if (normalized === 'on' || normalized === 'charging') {
    return 'Charging'
  }

  if (normalized === 'off' || normalized === 'idle') {
    return 'Idle'
  }

  return state
}

function formatGridStatus(value: number | null) {
  if (value === null) {
    return DASH
  }

  if (Math.abs(value) < 0.05) {
    return 'Balanced'
  }

  return value > 0 ? 'Importing' : 'Exporting'
}

function boundedPercent(value: number | null) {
  if (value === null) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function getFirstDefined<T>(values: T[]) {
  return values.find((value) => value !== undefined && value !== null)
}

function normalizeTime(value: unknown) {
  if (typeof value !== 'string') {
    return DASH
  }

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5)
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return value
}

function normalizeWeekdays(value: unknown) {
  if (!Array.isArray(value)) {
    return { label: DASH, value: undefined }
  }

  const numericDays = value
    .map((day) => (typeof day === 'number' ? day : Number.parseInt(String(day), 10)))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)

  if (!numericDays.length) {
    return { label: DASH, value: undefined }
  }

  return {
    label: numericDays.map((day) => WEEKDAY_LABELS[day]).join(', '),
    value: numericDays,
  }
}

function normalizeSchedulePlan(plan: unknown, index: number): EvccSchedulePlan | null {
  if (!plan || typeof plan !== 'object') {
    return null
  }

  const raw = plan as Record<string, unknown>
  const nestedPlan = raw.plan && typeof raw.plan === 'object' ? (raw.plan as Record<string, unknown>) : raw
  const weekdays = normalizeWeekdays(getFirstDefined([nestedPlan.weekdays, raw.weekdays]))
  const id = String(getFirstDefined([raw.id, raw.name, index]) ?? index)
  const label = String(getFirstDefined([raw.title, raw.label, raw.name]) ?? `Plan ${index + 1}`)
  const soc = getFirstDefined([nestedPlan.soc, nestedPlan.targetSoc, nestedPlan.target_soc, raw.soc])

  return {
    active: Boolean(getFirstDefined([raw.active, raw.enabled, nestedPlan.active]) ?? true),
    id,
    label,
    soc: soc === undefined || soc === null ? DASH : String(soc),
    time: normalizeTime(getFirstDefined([nestedPlan.time, raw.time])),
    weekdays: weekdays.label,
    weekdaysValue: weekdays.value,
  }
}

function getEvccSchedulePlans(resolved: ResolvedEnergyEntities) {
  const fallbackSoc = getEntityState(resolved, 'evccVehicleRepeatingPlans')
  const fallbackTime = getEntityState(resolved, 'evccVehicleRepeatingPlansTime')
  const rawSource = getFirstDefined([
    getEntityAttribute(resolved, 'evccVehicleRepeatingPlans', 'repeatingPlans'),
    getEntityAttribute(resolved, 'evccVehicleRepeatingPlans', 'repeating_plans'),
    getEntityAttribute(resolved, 'evccVehicleRepeatingPlans', 'plans'),
    getEntityAttribute(resolved, 'evccVehicleRepeatingPlans', 'value'),
    getRawEntityState(resolved, 'evccVehicleRepeatingPlans'),
  ])
  const parsedSource = parseMaybeJson(rawSource)
  const source = Array.isArray(parsedSource)
    ? parsedSource
    : parsedSource && typeof parsedSource === 'object'
      ? Object.values(parsedSource)
      : []

  return source
    .map((plan, index) => normalizeSchedulePlan(plan, index))
    .filter((plan): plan is EvccSchedulePlan => Boolean(plan))
    .concat(
      source.length || (!fallbackSoc && !fallbackTime)
        ? []
        : [
            {
              active: true,
              id: 'evcc-plan',
              label: 'EVCC Plan',
              soc: fallbackSoc ?? DASH,
              time: normalizeTime(fallbackTime),
              weekdays: DASH,
            },
          ],
    )
}

export function useEnergyData() {
  const entities = useHass((state) => state.entities)

  return useMemo(() => {
    const resolved = resolveEnergyEntities(entities)
    const batterySoc = getNumericState(resolved, 'batterySoc')
    const batteryPowerValue = getNumericState(resolved, 'batteryPower')
    const evChargePowerValue = getNumericState(resolved, 'evChargePower')
    const gridPowerValue = getNumericState(resolved, 'gridPower')
    const selfPowered = getNumericState(resolved, 'selfPoweredPercent')
    const solarPowerValue = getNumericState(resolved, 'solarPower')

    return {
      solarPower: formatState(resolved, 'solarPower', 'kW'),
      solarPowerValue,
      solarPercent: formatState(resolved, 'solarPercent', '%'),
      homePower: formatState(resolved, 'homePower', 'kW'),
      homePercent: formatState(resolved, 'homePercent', '%'),
      gridPower: formatState(resolved, 'gridPower', 'kW'),
      gridPowerValue,
      gridStatus: formatGridStatus(gridPowerValue),
      gridExportedToday: formatState(resolved, 'gridExportedToday', 'kWh'),
      evChargePercent: formatState(resolved, 'evChargePercent', '%'),
      evChargePower: formatState(resolved, 'evChargePower', 'kW'),
      evRange: formatState(resolved, 'evRange', 'KM'),
      evChargePowerValue,
      evChargeRateLimit: formatState(resolved, 'evChargeRateLimit', 'A'),
      evChargeSessionEnergy: formatState(resolved, 'evChargeSessionEnergy', 'kWh'),
      evChargeSessionDuration: formatState(resolved, 'evChargeSessionDuration', 'text'),
      evChargeStatus: formatChargingStatus(resolved, 'evChargeStatus'),
      evccChargeMode: formatState(resolved, 'evccLoadpointMode', 'text'),
      evccChargeModeOptions: getEntityOptions(resolved, 'evccLoadpointMode'),
      evccChargePlanEnabled: formatPlanEnabled(resolved, 'evccChargePlanEnabled'),
      evccChargePlanFrom: formatPlanTime(resolved, 'evccChargePlanStart', '22:00'),
      evccChargePlanTo: formatPlanTime(resolved, 'evccChargePlanEnd', '06:00'),
      evccMaxCurrent: formatState(resolved, 'evccLoadpointMaxCurrent', 'A'),
      evccMaxCurrentOptions: getEntityOptions(resolved, 'evccLoadpointMaxCurrent'),
      evccSchedules: getEvccSchedulePlans(resolved),
      batterySoc: formatState(resolved, 'batterySoc', '%'),
      batterySocValue: boundedPercent(batterySoc),
      batteryEnergy: formatState(resolved, 'batteryEnergy', 'kWh'),
      batteryPower: formatState(resolved, 'batteryPower', 'kW'),
      batteryPowerValue,
      solarProductionToday: formatState(resolved, 'solarProductionToday', 'kWh'),
      batteryStatus: formatBatteryStatus(batteryPowerValue),
      solarForecastToday: formatState(resolved, 'solarForecastToday', 'kWh'),
      selfPoweredPercent: formatState(resolved, 'selfPoweredPercent', '%'),
      selfPoweredValue: boundedPercent(selfPowered),
      energyIndependence: formatState(resolved, 'energyIndependence', 'kWh'),
      peakRateNow: formatState(resolved, 'peakRateNow', 'price'),
      peakRateNext: formatState(resolved, 'peakRateNext', 'price'),
    }
  }, [entities])
}
