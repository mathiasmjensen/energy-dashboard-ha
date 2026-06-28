import type { EvccChargeMode, EvccScheduleAction, EvccSchedulePlan, EvccScheduleScriptVariables } from '../models/evcc'

export const EVCC_CHARGE_MODES: Array<{ label: string; value: EvccChargeMode }> = [
  { label: 'Off', value: 'off' },
  { label: 'Solar', value: 'pv' },
  { label: 'Solar + minimum', value: 'minpv' },
  { label: 'Fast', value: 'now' },
]

export const EVCC_FALLBACK_SCHEDULES: EvccSchedulePlan[] = [
  {
    active: true,
    id: 'daily',
    label: 'Daily',
    soc: '80',
    time: '22:00',
    weekdays: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
    weekdaysValue: [1, 2, 3, 4, 5, 6, 0],
  },
  {
    active: true,
    id: 'weekdays',
    label: 'Weekdays',
    soc: '80',
    time: '23:00',
    weekdays: 'Mon, Tue, Wed, Thu, Fri',
    weekdaysValue: [1, 2, 3, 4, 5],
  },
  {
    active: true,
    id: 'weekends',
    label: 'Weekends',
    soc: '80',
    time: '00:00',
    weekdays: 'Sat, Sun',
    weekdaysValue: [6, 0],
  },
]

export function normalizeEvccMode(mode: string | null | undefined): EvccChargeMode {
  const normalizedMode = (mode ?? '').toLowerCase().replace(/[\s_+-]/g, '')

  if (normalizedMode === 'off') {
    return 'off'
  }

  if (normalizedMode === 'now' || normalizedMode === 'fast') {
    return 'now'
  }

  if (normalizedMode === 'minpv' || normalizedMode === 'minpvcharging') {
    return 'minpv'
  }

  return 'pv'
}

export function getEvccModeServiceOption(mode: EvccChargeMode, entityOptions: string[]) {
  return entityOptions.find((option) => normalizeEvccMode(option) === mode) ?? mode
}

export function buildEvccScheduleScriptVariables(
  plan: EvccSchedulePlan,
  action: EvccScheduleAction,
): EvccScheduleScriptVariables {
  const soc = Number.parseInt(plan.soc, 10)
  const targetSoc = Number.isFinite(soc) ? Math.min(100, Math.max(0, soc)) : null
  const time = /^\d{2}:\d{2}$/.test(plan.time) ? plan.time : null
  const weekdays = plan.weekdaysValue ?? []

  return {
    action,
    active: plan.active,
    plan: {
      active: plan.active,
      enabled: plan.active,
      id: plan.id,
      label: plan.label,
      soc: targetSoc,
      target_soc: targetSoc,
      targetSoc,
      time,
      weekdays,
    },
    plan_id: plan.id,
  }
}
