import { ENERGY_ENTITIES, ENERGY_ENTITY_CANDIDATES, type EnergyEntityKey } from './energyEntities'
import type { HassEntity, ResolvedEnergyEntities, ResolvedEnergyEntity } from '../models/resolveEnergyEntities'

const ENTITY_MATCHERS: Partial<Record<EnergyEntityKey, string[][]>> = {
  batteryEnergy: [
    ['fox', 'battery', 'energy'],
    ['fox', 'battery', 'capacity'],
  ],
  batteryPower: [
    ['fox', 'battery', 'power'],
    ['fox', 'battery', 'charge', 'discharge'],
  ],
  batteryChargeToday: [
    ['energy', 'dashboard', 'battery', 'charge', 'today'],
    ['fox', 'battery', 'charge', 'today'],
    ['fox', 'battery', 'charged', 'today'],
  ],
  batteryDischargeToday: [
    ['energy', 'dashboard', 'battery', 'discharge', 'today'],
    ['fox', 'battery', 'discharge', 'today'],
    ['fox', 'battery', 'discharged', 'today'],
  ],
  batterySoc: [
    ['fox', 'battery', 'soc'],
    ['fox', 'battery', 'state', 'of', 'charge'],
  ],
  gridImportToday: [
    ['energy', 'dashboard', 'grid', 'import', 'today'],
    ['fox', 'grid', 'consumption', 'today'],
    ['fox', 'grid', 'import', 'today'],
    ['fox', 'import', 'today'],
  ],
  gridExportedToday: [
    ['energy', 'dashboard', 'feed', 'in', 'today'],
    ['fox', 'feed', 'in', 'today'],
    ['fox', 'grid', 'export', 'today'],
    ['fox', 'export', 'today'],
  ],
  gridPower: [
    ['fox', 'grid', 'power'],
    ['fox', 'grid', 'consumption', 'power'],
    ['fox', 'import', 'export', 'power'],
  ],
  homeEnergyToday: [
    ['energy', 'dashboard', 'home', 'consumption', 'today'],
    ['fox', 'load', 'energy', 'today'],
    ['fox', 'home', 'consumption', 'today'],
    ['fox', 'consumption', 'today'],
  ],
  homePower: [
    ['fox', 'load', 'power'],
    ['fox', 'home', 'power'],
    ['fox', 'consumption', 'power'],
  ],
  solarPower: [
    ['fox', 'solar', 'power'],
    ['fox', 'pv', 'power'],
    ['fox', 'generation', 'power'],
  ],
  solarProductionToday: [
    ['energy', 'dashboard', 'solar', 'production', 'today'],
    ['fox', 'generation', 'today'],
    ['fox', 'solar', 'today'],
    ['fox', 'pv', 'today'],
  ],
}

function normalizeText(value: string | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getConfiguredIds(key: EnergyEntityKey) {
  const candidates = ENERGY_ENTITY_CANDIDATES[key] ?? []
  const fallback = ENERGY_ENTITIES[key]
  const ids = [...candidates, fallback]
  return [...new Set(ids.filter(Boolean))]
}

function matchByPatterns(entries: Array<[string, HassEntity]>, key: EnergyEntityKey) {
  const matchers = ENTITY_MATCHERS[key] ?? []

  if (!matchers.length) {
    return null
  }

  for (const [entityId, entity] of entries) {
    const haystack = `${normalizeText(entityId)} ${normalizeText(String(entity.attributes?.friendly_name ?? ''))}`

    if (!haystack.includes('fox')) {
      continue
    }

    if (matchers.some((terms) => terms.every((term) => haystack.includes(term)))) {
      return {
        entity,
        entityId,
      } satisfies ResolvedEnergyEntity
    }
  }

  return null
}

export function resolveEnergyEntities(entities: HassEntities): ResolvedEnergyEntities {
  const entries = Object.entries(entities) as Array<[string, HassEntity]>
  const resolved: ResolvedEnergyEntities = {}

  for (const key of Object.keys(ENERGY_ENTITIES) as EnergyEntityKey[]) {
    const configured = getConfiguredIds(key)
    const exactEntityId = configured.find((entityId) => Boolean(entities[entityId]))

    if (exactEntityId) {
      resolved[key] = {
        entity: entities[exactEntityId],
        entityId: exactEntityId,
      }
      continue
    }

    const fuzzyMatch = matchByPatterns(entries, key)

    if (fuzzyMatch) {
      resolved[key] = fuzzyMatch
    }
  }

  return resolved
}
