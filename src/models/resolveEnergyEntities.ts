import type { HassEntities } from 'home-assistant-js-websocket'
import type { EnergyEntityKey } from '../data/energyEntities'

export type HassEntity = HassEntities[string]

export type ResolvedEnergyEntity = {
  entity: HassEntity
  entityId: string
}

export type ResolvedEnergyEntities = Partial<Record<EnergyEntityKey, ResolvedEnergyEntity>>
