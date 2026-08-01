import type { BatteryOptimizerLiveInputs, BatteryOptimizerState } from '../models/batteryOptimizer'
import { getBatteryOptimizerMode } from '../services/predbat'
import { useLegacyBatteryOptimizer } from './useLegacyBatteryOptimizer'
import { usePredbatBatteryOptimizer } from './usePredbatBatteryOptimizer'

export function useBatteryOptimizer(inputs: BatteryOptimizerLiveInputs): BatteryOptimizerState {
  const mode = getBatteryOptimizerMode()
  const predbatState = usePredbatBatteryOptimizer(inputs, mode === 'predbat')
  const legacyState = useLegacyBatteryOptimizer(inputs, mode === 'legacy-api')

  if (mode === 'predbat') {
    return predbatState
  }

  return legacyState
}
