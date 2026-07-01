import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { getDashboardMockData } from '../services/dashboardMockData'
import type { TodayEnergyTotals } from '../models/todayEnergyTotals'
import { getNumericState } from '../services/energyEntityFormatting'
import {
  formatKwh,
  getInitialTodayEnergyTotals,
  readTodayEnergyTotalsCache,
  writeTodayEnergyTotalsCache,
} from '../services/todayEnergyTotals'

const CACHE_MS = 5 * 60 * 1000
const POLL_MS = 5 * 60 * 1000

export function useTodayEnergyTotals() {
  const entities = useHass((state) => state.entities)
  const [totals, setTotals] = useState<TodayEnergyTotals>(getInitialTodayEnergyTotals)
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])

  useEffect(() => {
    async function fetchTotals() {
      const now = new Date()
      const mockTotals = getDashboardMockData(now).todayEnergyTotals
      const cached = readTodayEnergyTotalsCache(now)
      const directHomeKwh = getNumericState(resolved, 'homeEnergyToday')
      const directGridExportKwh = getNumericState(resolved, 'gridExportedToday')
      const directGridKwh = getNumericState(resolved, 'gridImportToday')
      const directEvKwh = getNumericState(resolved, 'evChargeSessionEnergy')

      if (cached && Date.now() - cached.createdAt < CACHE_MS) {
        setTotals({
          evKwh: directEvKwh !== null ? formatKwh(directEvKwh) : cached.totals.evKwh,
          gridExportKwh: directGridExportKwh !== null ? formatKwh(directGridExportKwh) : cached.totals.gridExportKwh,
          gridKwh: directGridKwh !== null ? formatKwh(directGridKwh) : cached.totals.gridKwh,
          homeKwh: directHomeKwh !== null ? formatKwh(directHomeKwh) : cached.totals.homeKwh,
        })
        return
      }

      const nextTotals = {
        evKwh: directEvKwh !== null ? formatKwh(directEvKwh) : cached?.totals.evKwh ?? mockTotals.evKwh,
        gridExportKwh: directGridExportKwh !== null ? formatKwh(directGridExportKwh) : cached?.totals.gridExportKwh ?? mockTotals.gridExportKwh,
        gridKwh: directGridKwh !== null ? formatKwh(directGridKwh) : cached?.totals.gridKwh ?? mockTotals.gridKwh,
        homeKwh: directHomeKwh !== null ? formatKwh(directHomeKwh) : cached?.totals.homeKwh ?? mockTotals.homeKwh,
      }

      setTotals(nextTotals)
      writeTodayEnergyTotalsCache(now, nextTotals)
    }

    void fetchTotals()
    const pollId = window.setInterval(fetchTotals, POLL_MS)

    return () => {
      window.clearInterval(pollId)
    }
  }, [resolved])

  return useMemo(() => totals, [totals])
}
