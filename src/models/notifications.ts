export type NotificationPermissionModel = NotificationPermission | 'unsupported'

export type NotificationHistoryEntry = {
  body: string
  id: string
  sentAt: string
  tag: string | null
  title: string
  url: string | null
}

export type NotificationsPublicKeyPayload = {
  publicKey: string
}

export type NotificationsSubscribePayload = {
  subscription: PushSubscriptionJSON
}

export type NotificationsUnsubscribePayload = {
  endpoint: string
}

export type NotificationPreferenceKey = 'batteryOptimizer' | 'evCharging' | 'priceDrops' | 'solarSurplus'

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export type NotificationsState = {
  backendAvailable: boolean
  endpoint: string | null
  errorMessage: string | null
  history: NotificationHistoryEntry[]
  isLoading: boolean
  isSubscribed: boolean
  isSyncing: boolean
  lastSyncedAt: string | null
  permission: NotificationPermissionModel
  supported: boolean
}
