import { useCallback, useEffect, useMemo, useState } from 'react'
import type { NotificationsState } from '../models/notifications'
import { createNotificationsClient, isNotificationsEnabled, NotificationsRequestError } from '../services/notificationsClient'

const EMPTY_STATE: NotificationsState = {
  backendAvailable: false,
  endpoint: null,
  errorMessage: null,
  history: [],
  isLoading: false,
  isSubscribed: false,
  isSyncing: false,
  lastSyncedAt: null,
  permission: 'unsupported',
  supported: false,
}

export function useNotifications() {
  const client = useMemo(() => createNotificationsClient(), [])
  const enabled = isNotificationsEnabled()
  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  const [state, setState] = useState<NotificationsState>(() => ({
    ...EMPTY_STATE,
    isLoading: enabled && supported,
    permission: supported ? Notification.permission : 'unsupported',
    supported,
  }))

  const syncExistingSubscription = useCallback(
    async (registration: ServiceWorkerRegistration) => {
      if (!client) {
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      const endpoint = subscription?.endpoint ?? null
      const hasSubscription = Boolean(subscription)

      setState((current) => ({
        ...current,
        endpoint,
        isSubscribed: hasSubscription,
        lastSyncedAt: new Date().toISOString(),
        permission: Notification.permission,
      }))

      if (!subscription || Notification.permission !== 'granted') {
        return
      }

      await client.subscribe({ subscription: subscription.toJSON() })
      const history = await client.getHistory()
      setState((current) => ({
        ...current,
        backendAvailable: true,
        endpoint,
        errorMessage: null,
        history,
        isSubscribed: true,
        lastSyncedAt: new Date().toISOString(),
        permission: Notification.permission,
      }))
    },
    [client],
  )

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!enabled || !supported || !client) {
        setState((current) => ({
          ...current,
          isLoading: false,
        }))
        return
      }

      try {
        const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}notifications-sw.js`)
        if (cancelled) {
          return
        }

        await syncExistingSubscription(registration)
        if (cancelled) {
          return
        }

        setState((current) => ({
          ...current,
          backendAvailable: true,
          errorMessage: null,
          isLoading: false,
        }))
      } catch (error) {
        if (cancelled) {
          return
        }

        const isMissing = error instanceof NotificationsRequestError && error.status === 404
        setState((current) => ({
          ...current,
          backendAvailable: !isMissing,
          errorMessage: isMissing ? null : error instanceof Error ? error.message : 'Notifications unavailable',
          isLoading: false,
        }))
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [client, enabled, supported, syncExistingSubscription])

  const enable = useCallback(async () => {
    if (!client || !supported) {
      return false
    }

    setState((current) => ({ ...current, isSyncing: true }))
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState((current) => ({
          ...current,
          isSyncing: false,
          permission,
        }))
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const keyPayload = await client.getPublicKey()
      const existingSubscription = await registration.pushManager.getSubscription()
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          applicationServerKey: decodeBase64Url(keyPayload.publicKey),
          userVisibleOnly: true,
        }))

      await client.subscribe({ subscription: subscription.toJSON() })
      const history = await client.getHistory()
      setState((current) => ({
        ...current,
        backendAvailable: true,
        endpoint: subscription.endpoint,
        errorMessage: null,
        history,
        isSubscribed: true,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        permission,
      }))
      return true
    } catch (error) {
      const isMissing = error instanceof NotificationsRequestError && error.status === 404
      setState((current) => ({
        ...current,
        backendAvailable: !isMissing,
        errorMessage: isMissing ? null : error instanceof Error ? error.message : 'Could not enable notifications',
        isSyncing: false,
      }))
      return false
    }
  }, [client, supported])

  const disable = useCallback(async () => {
    if (!client || !supported) {
      return false
    }

    setState((current) => ({ ...current, isSyncing: true }))
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await client.unsubscribe({ endpoint: subscription.endpoint })
        await subscription.unsubscribe()
      }

      setState((current) => ({
        ...current,
        endpoint: null,
        errorMessage: null,
        history: [],
        isSubscribed: false,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        errorMessage: error instanceof Error ? error.message : 'Could not disable notifications',
        isSyncing: false,
      }))
      return false
    }
  }, [client, supported])

  const refresh = useCallback(async () => {
    if (!client || !supported) {
      return false
    }

    setState((current) => ({ ...current, isSyncing: true }))
    try {
      const history = await client.getHistory()
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setState((current) => ({
        ...current,
        backendAvailable: true,
        endpoint: subscription?.endpoint ?? current.endpoint,
        errorMessage: null,
        history,
        isSubscribed: Boolean(subscription),
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
        permission: Notification.permission,
      }))
      return true
    } catch (error) {
      const isMissing = error instanceof NotificationsRequestError && error.status === 404
      setState((current) => ({
        ...current,
        backendAvailable: !isMissing,
        errorMessage: isMissing ? null : error instanceof Error ? error.message : 'Could not refresh notifications',
        isSyncing: false,
      }))
      return false
    }
  }, [client, supported])

  return {
    ...state,
    disable,
    enable,
    refresh,
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.padEnd(Math.ceil(value.length / 4) * 4, '=').replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(normalized)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}
