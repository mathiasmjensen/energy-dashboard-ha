import { useMemo } from 'react'
import { createMockBatteryOptimizerSnapshot, isBatteryOptimizerStale } from '../services/batteryOptimizer'
import type { BatteryOptimizerLiveInputs, BatteryOptimizerState } from '../models/batteryOptimizer'

export function useMockBatteryOptimizer(inputs: BatteryOptimizerLiveInputs, enabled: boolean): BatteryOptimizerState {
  const snapshot = useMemo(() => createMockBatteryOptimizerSnapshot(inputs), [inputs])

  return {
    applyPlan: () => undefined,
    errorMessage: enabled ? null : 'Mock optimizer disabled',
    hasLiveError: false,
    isApplyingPlan: false,
    isEmpty: !snapshot || snapshot.planRows.length === 0,
    isLoading: false,
    isPausing: false,
    isRefreshing: false,
    isSavingSettings: false,
    isStale: snapshot ? isBatteryOptimizerStale(snapshot.status.updatedAt) : false,
    mode: 'mock',
    pauseUntilTomorrow: () => undefined,
    refresh: () => undefined,
    retry: () => undefined,
    snapshot,
    updateSetting: () => undefined,
  }
}
