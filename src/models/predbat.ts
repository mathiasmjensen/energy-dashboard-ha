import type { HassEntities } from 'home-assistant-js-websocket'

export type HassEntityMap = HassEntities

export type PredbatResolvedEntities = Partial<Record<
  import('../data/predbatEntities').PredbatEntityKey,
  {
    entity: HassEntities[string]
    entityId: string
  }
>>

export type PredbatResolvedEntity = PredbatResolvedEntities[keyof PredbatResolvedEntities]
