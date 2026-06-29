export type DataStateTone = 'live' | 'mock' | 'stale'

export interface DataStateBadgeModel {
  label: string
  tone: DataStateTone
}
