export type EvccChargeMode = 'off' | 'pv' | 'minpv' | 'now'

export type EvccScheduleAction = 'add' | 'set'

export type EvccSchedulePlan = {
  active: boolean
  id: string
  label: string
  soc: string
  time: string
  weekdays: string
  weekdaysValue?: number[]
}

export type EvccScheduleScriptVariables = {
  action: EvccScheduleAction
  active: boolean
  plan: {
    active: boolean
    enabled: boolean
    id: string
    label: string
    soc: number | null
    target_soc: number | null
    targetSoc: number | null
    time: string | null
    weekdays: number[]
  }
  plan_id: string
}
