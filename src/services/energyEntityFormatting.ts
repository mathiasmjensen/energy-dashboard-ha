import { ENERGY_ENTITY_NUMERIC_SCALE, type EnergyEntityKey } from '../data/energyEntities'
import type { EvccSchedulePlan } from '../data/evcc'
import type { ResolvedEnergyEntities } from '../data/resolveEnergyEntities'

export type EnergyDisplayUnit = 'A' | 'kW' | 'kWh' | '%' | 'kg' | 'price' | 'text' | 'KM'

const DASH = '---'
const UNKNOWN_STATES = new Set(['unknown', 'unavailable', 'none', 'null', ''])
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getResolvedEntity(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  return resolved[key]?.entity
}

export function getEntityState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const entity = getResolvedEntity(resolved, key)
  const state = entity?.state?.trim()

  if (!state || UNKNOWN_STATES.has(state.toLowerCase())) {
    return null
  }

  return state
}

export function getNumericState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
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

export function getEntityOptions(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const options = getResolvedEntity(resolved, key)?.attributes.options

  if (!Array.isArray(options)) {
    return []
  }

  return options.map(String)
}

export function formatPlanTime(resolved: ResolvedEnergyEntities, key: EnergyEntityKey, fallback: string) {
  const state = getEntityState(resolved, key)

  if (!state) {
    return fallback
  }

  if (/^\d{2}:\d{2}/.test(state)) {
    return state.slice(0, 5)
  }

  return fallback
}

export function formatPlanEnabled(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const state = getEntityState(resolved, key)

  return state?.toLowerCase() === 'on'
}

export function formatState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey, unit: EnergyDisplayUnit): string {
  if (unit === 'text') {
    return getEntityState(resolved, key) ?? DASH
  }

  return formatNumber(getNumericState(resolved, key), unit)
}

export function formatBatteryStatus(value: number | null) {
  if (value === null || Math.abs(value) < 0.05) {
    return 'Idle'
  }

  return value > 0 ? 'Discharging' : 'Charging'
}

export function formatChargingStatus(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
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

export function formatGridStatus(value: number | null) {
  if (value === null) {
    return DASH
  }

  if (Math.abs(value) < 0.05) {
    return 'Balanced'
  }

  return value > 0 ? 'Importing' : 'Exporting'
}

export function boundedPercent(value: number | null) {
  if (value === null) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

export function getEvccSchedulePlans(resolved: ResolvedEnergyEntities) {
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

function getRawEntityState(resolved: ResolvedEnergyEntities, key: EnergyEntityKey) {
  const entity = getResolvedEntity(resolved, key)
  return entity?.state ?? null
}

function getEntityAttribute(resolved: ResolvedEnergyEntities, key: EnergyEntityKey, attribute: string) {
  return getResolvedEntity(resolved, key)?.attributes[attribute]
}

function formatNumber(value: number | null, unit: EnergyDisplayUnit): string {
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
