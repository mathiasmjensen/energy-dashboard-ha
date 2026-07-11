import type {
  HistoricalEnergyDayCacheEntry,
  HistoricalEnergyDayDistribution,
  HistoricalEnergyDaySolarProduction,
} from '../models/historicalEnergyDay'

const CACHE_KEY_PREFIX = 'energy-dashboard:historical-energy-day:'

export function getEmptyHistoricalDistribution(): HistoricalEnergyDayDistribution {
  return {
    battery: '---',
    batteryCharge: '---',
    batteryDischarge: '---',
    ev: '---',
    gridExport: '---',
    gridImport: '---',
    grid: '---',
    home: '---',
    solar: '---',
  }
}

export function getEmptyHistoricalSolarProduction(): HistoricalEnergyDaySolarProduction {
  return {
    curve: Array.from({ length: 24 }, () => 0),
    labels: Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`),
    value: '---',
  }
}

export function readHistoricalEnergyDayCache(sourceKey: string, dayKey: string) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(sourceKey, dayKey))
    const parsed = raw ? (JSON.parse(raw) as HistoricalEnergyDayCacheEntry) : null

    if (!parsed?.distribution || !parsed?.solarProduction) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeHistoricalEnergyDayCache(sourceKey: string, dayKey: string, entry: Omit<HistoricalEnergyDayCacheEntry, 'createdAt'>) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getCacheKey(sourceKey, dayKey),
      JSON.stringify({
        ...entry,
        createdAt: Date.now(),
      } satisfies HistoricalEnergyDayCacheEntry),
    )
  } catch {
    // localStorage can be unavailable in hardened browsers.
  }
}

function getCacheKey(sourceKey: string, dayKey: string) {
  return `${CACHE_KEY_PREFIX}${sourceKey}:${dayKey}`
}
