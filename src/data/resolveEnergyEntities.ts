import type { HassEntities } from 'home-assistant-js-websocket'
import { ENERGY_ENTITIES, ENERGY_ENTITY_CANDIDATES, type EnergyEntityKey } from './energyEntities'

type HassEntity = HassEntities[string]

export type ResolvedEnergyEntity = {
  entity: HassEntity
  entityId: string
}

export type ResolvedEnergyEntities = Partial<Record<EnergyEntityKey, ResolvedEnergyEntity>>

const ENTITY_MATCHERS: Partial<Record<EnergyEntityKey, string[][]>> = {
  batteryEnergy: [
    ['fox', 'battery', 'energy'],
    ['fox', 'battery', 'capacity'],
  ],
  batteryPower: [
    ['fox', 'battery', 'power'],
    ['fox', 'battery', 'charge', 'discharge'],
  ],
  batterySoc: [
    ['fox', 'battery', 'soc'],
    ['fox', 'battery', 'state', 'of', 'charge'],
  ],
  gridImportToday: [
    ['fox', 'grid', 'consumption', 'today'],
    ['fox', 'grid', 'import', 'today'],
    ['fox', 'import', 'today'],
  ],
  gridPower: [
    ['fox', 'grid', 'power'],
    ['fox', 'grid', 'consumption', 'power'],
    ['fox', 'import', 'export', 'power'],
  ],
  homeEnergyToday: [
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
