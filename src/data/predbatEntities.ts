export const PREDBAT_ENTITY_DEFAULTS = {
  activeSwitch: 'switch.predbat_active',
  allowBatteryExportSwitch: 'switch.predbat_allow_battery_export',
  allowGridChargingSwitch: 'switch.predbat_allow_grid_charging',
  applyPlanScript: 'script.energy_dashboard_predbat_apply_plan',
  batteryCapacitySensor: 'sensor.predbat_battery_capacity',
  batteryHoursLeftSensor: 'predbat.battery_hours_left',
  batteryPowerSensor: 'predbat.battery_power',
  batterySocSensor: 'sensor.predbat_battery_soc',
  fullBuyPriceSensor: 'sensor.predbat_full_buy_price',
  gridPowerSensor: 'predbat.grid_power',
  maxGridChargeInput: 'input_number.predbat_max_grid_charge_kwh',
  modeSelect: 'select.predbat_mode',
  pauseScript: 'script.energy_dashboard_predbat_pause_until_tomorrow',
  pausedUntilHelper: 'input_datetime.energy_dashboard_predbat_paused_until',
  planSensor: 'sensor.energy_dashboard_predbat_plan',
  profitTodaySensor: 'sensor.predbat_profit_today',
  readOnlySwitch: 'switch.predbat_set_read_only',
  recommendationSensor: 'sensor.predbat_recommendation',
  refreshScript: 'script.energy_dashboard_predbat_refresh',
  reserveInput: 'input_number.predbat_min_reserve_percent',
  sellPriceSensor: 'sensor.predbat_sell_price',
  spotPriceSensor: 'sensor.predbat_spot_price',
  statusSensor: 'sensor.predbat_status',
  updatedAtSensor: 'sensor.predbat_updated_at',
} as const

export const PREDBAT_ENTITY_CANDIDATES: Record<keyof typeof PREDBAT_ENTITY_DEFAULTS, string[]> = {
  activeSwitch: [
    'switch.predbat_active',
    'input_boolean.predbat_active',
  ],
  batteryCapacitySensor: [
    'sensor.predbat_battery_capacity',
  ],
  batteryHoursLeftSensor: [
    'predbat.battery_hours_left',
    'sensor.predbat_battery_hours_left',
  ],
  batteryPowerSensor: [
    'predbat.battery_power',
    'sensor.predbat_battery_power',
  ],
  batterySocSensor: [
    'sensor.predbat_battery_soc',
  ],
  allowBatteryExportSwitch: [
    'switch.predbat_allow_battery_export',
    'switch.predbat_export_enable',
    'switch.predbat_best_export',
    'input_boolean.predbat_allow_battery_export',
  ],
  allowGridChargingSwitch: [
    'switch.predbat_allow_grid_charging',
    'switch.predbat_allow_grid_charge',
    'switch.predbat_best_charge',
    'input_boolean.predbat_allow_grid_charging',
  ],
  applyPlanScript: [
    'script.energy_dashboard_predbat_apply_plan',
  ],
  fullBuyPriceSensor: [
    'sensor.predbat_full_buy_price',
    'sensor.predbat_import_rate',
    'sensor.predbat_buy_price',
    'sensor.energy_dashboard_predbat_full_buy_price',
  ],
  gridPowerSensor: [
    'predbat.grid_power',
    'sensor.predbat_grid_power',
  ],
  maxGridChargeInput: [
    'input_number.predbat_max_grid_charge_kwh',
    'input_number.predbat_max_charge_kwh',
    'input_number.predbat_max_grid_charge',
    'number.predbat_max_grid_charge_kwh',
  ],
  modeSelect: [
    'select.predbat_mode',
    'input_select.predbat_mode',
  ],
  pauseScript: [
    'script.energy_dashboard_predbat_pause_until_tomorrow',
  ],
  pausedUntilHelper: [
    'input_datetime.energy_dashboard_predbat_paused_until',
  ],
  planSensor: [
    'sensor.energy_dashboard_predbat_plan',
    'predbat.plan_html',
    'sensor.predbat_plan_html',
    'predbat.plan',
    'sensor.predbat_plan',
    'sensor.energy_dashboard_predbat_plan_raw',
  ],
  profitTodaySensor: [
    'sensor.predbat_profit_today',
    'sensor.predbat_estimated_profit_today',
    'sensor.energy_dashboard_predbat_profit_today',
  ],
  readOnlySwitch: [
    'switch.predbat_set_read_only',
    'input_boolean.predbat_set_read_only',
    'switch.predbat_read_only',
  ],
  recommendationSensor: [
    'sensor.predbat_recommendation',
    'sensor.predbat_best_action',
    'sensor.energy_dashboard_predbat_recommendation',
  ],
  refreshScript: [
    'script.energy_dashboard_predbat_refresh',
  ],
  reserveInput: [
    'input_number.predbat_min_reserve_percent',
    'input_number.predbat_reserve',
    'input_number.predbat_best_soc_min',
    'number.predbat_min_reserve_percent',
  ],
  sellPriceSensor: [
    'sensor.predbat_sell_price',
    'sensor.predbat_export_rate',
    'sensor.predbat_feed_in_price',
    'sensor.energy_dashboard_predbat_sell_price',
  ],
  spotPriceSensor: [
    'sensor.predbat_spot_price',
    'sensor.predbat_import_rate',
    'sensor.predbat_current_rate',
    'sensor.energy_dashboard_predbat_spot_price',
  ],
  statusSensor: [
    'predbat.status',
    'sensor.predbat_status',
    'sensor.energy_dashboard_predbat_status',
  ],
  updatedAtSensor: [
    'sensor.predbat_updated_at',
    'sensor.energy_dashboard_predbat_updated_at',
  ],
}

export type PredbatEntityKey = keyof typeof PREDBAT_ENTITY_DEFAULTS

const ENV_KEYS: Record<PredbatEntityKey, string> = {
  activeSwitch: 'VITE_PREDBAT_ACTIVE_SWITCH',
  allowBatteryExportSwitch: 'VITE_PREDBAT_ALLOW_BATTERY_EXPORT_SWITCH',
  allowGridChargingSwitch: 'VITE_PREDBAT_ALLOW_GRID_CHARGING_SWITCH',
  applyPlanScript: 'VITE_PREDBAT_APPLY_PLAN_SCRIPT',
  batteryCapacitySensor: 'VITE_PREDBAT_BATTERY_CAPACITY_SENSOR',
  batteryHoursLeftSensor: 'VITE_PREDBAT_BATTERY_HOURS_LEFT_SENSOR',
  batteryPowerSensor: 'VITE_PREDBAT_BATTERY_POWER_SENSOR',
  batterySocSensor: 'VITE_PREDBAT_BATTERY_SOC_SENSOR',
  fullBuyPriceSensor: 'VITE_PREDBAT_FULL_BUY_PRICE_SENSOR',
  gridPowerSensor: 'VITE_PREDBAT_GRID_POWER_SENSOR',
  maxGridChargeInput: 'VITE_PREDBAT_MAX_GRID_CHARGE_INPUT',
  modeSelect: 'VITE_PREDBAT_MODE_SELECT',
  pauseScript: 'VITE_PREDBAT_PAUSE_SCRIPT',
  pausedUntilHelper: 'VITE_PREDBAT_PAUSED_UNTIL_HELPER',
  planSensor: 'VITE_PREDBAT_PLAN_SENSOR',
  profitTodaySensor: 'VITE_PREDBAT_PROFIT_TODAY_SENSOR',
  readOnlySwitch: 'VITE_PREDBAT_READ_ONLY_SWITCH',
  recommendationSensor: 'VITE_PREDBAT_RECOMMENDATION_SENSOR',
  refreshScript: 'VITE_PREDBAT_REFRESH_SCRIPT',
  reserveInput: 'VITE_PREDBAT_RESERVE_INPUT',
  sellPriceSensor: 'VITE_PREDBAT_SELL_PRICE_SENSOR',
  spotPriceSensor: 'VITE_PREDBAT_SPOT_PRICE_SENSOR',
  statusSensor: 'VITE_PREDBAT_STATUS_SENSOR',
  updatedAtSensor: 'VITE_PREDBAT_UPDATED_AT_SENSOR',
}

export function getConfiguredPredbatEntityIds(key: PredbatEntityKey) {
  const env = import.meta.env ?? {}
  const explicit = String(env[ENV_KEYS[key]] ?? '').trim()
  const ids = [
    ...(explicit ? [explicit] : []),
    ...PREDBAT_ENTITY_CANDIDATES[key],
    PREDBAT_ENTITY_DEFAULTS[key],
  ]

  return [...new Set(ids.filter(Boolean))]
}
