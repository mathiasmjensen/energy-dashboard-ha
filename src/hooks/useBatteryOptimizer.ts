import type { BatteryOptimizerLiveInputs, BatteryOptimizerState } from '../models/batteryOptimizer'
import { getBatteryOptimizerMode } from '../services/predbat'
import { useLegacyBatteryOptimizer } from './useLegacyBatteryOptimizer'
import { useMockBatteryOptimizer } from './useMockBatteryOptimizer'
import { usePredbatBatteryOptimizer } from './usePredbatBatteryOptimizer'

export function useBatteryOptimizer(inputs: BatteryOptimizerLiveInputs): BatteryOptimizerState {
  const mode = getBatteryOptimizerMode()
  const predbatState = usePredbatBatteryOptimizer(inputs, mode === 'predbat')
  const legacyState = useLegacyBatteryOptimizer(inputs, mode === 'legacy-api')
  const mockState = useMockBatteryOptimizer(inputs, mode === 'mock')

  if (mode === 'predbat') {
    return predbatState
  }

  if (mode === 'legacy-api') {
    return legacyState
  }

  return mockState
}
