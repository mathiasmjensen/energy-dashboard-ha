import { useEffect, useState } from 'react'
import type { NotificationPreferences, NotificationPreferenceKey } from '../models/notifications'

const STORAGE_KEY = 'energy-dashboard-notification-preferences'

const DEFAULT_PREFERENCES: NotificationPreferences = {
  batteryOptimizer: true,
  evCharging: true,
  priceDrops: true,
  solarSurplus: false,
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadPreferences())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // localStorage can be unavailable in hardened browsers.
    }
  }, [preferences])

  const setPreference = (key: NotificationPreferenceKey, value: boolean) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return {
    preferences,
    setPreference,
  }
}

function loadPreferences() {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_PREFERENCES
    }

    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}
