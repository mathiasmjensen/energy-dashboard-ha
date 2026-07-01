import { resolveBrowserVisibleUrl } from './runtimeSecurity'
import type {
  NotificationHistoryEntry,
  NotificationsPublicKeyPayload,
  NotificationsSubscribePayload,
  NotificationsUnsubscribePayload,
} from '../models/notifications'

export class NotificationsRequestError extends Error {
  status: number

  constructor(status: number, message?: string) {
    super(message ?? `Notifications request failed with ${status}`)
    this.name = 'NotificationsRequestError'
    this.status = status
  }
}

export function resolveNotificationsBase() {
  const configured = import.meta.env.VITE_NOTIFICATIONS_BASE_URL?.trim() ?? ''
  return configured ? resolveBrowserVisibleUrl(configured) : ''
}

export function isNotificationsEnabled() {
  return Boolean(resolveNotificationsBase())
}

export function createNotificationsClient(baseUrl = resolveNotificationsBase()) {
  if (!baseUrl) {
    return null
  }

  return {
    getHistory: () => requestJson<NotificationHistoryEntry[]>(baseUrl, '/api/notifications/history'),
    getPublicKey: () => requestJson<NotificationsPublicKeyPayload>(baseUrl, '/api/notifications/public-key'),
    subscribe: (payload: NotificationsSubscribePayload) =>
      requestJson<void>(baseUrl, '/api/notifications/subscribe', { body: JSON.stringify(payload), method: 'POST' }).then(() => undefined),
    unsubscribe: (payload: NotificationsUnsubscribePayload) =>
      requestJson<void>(baseUrl, '/api/notifications/unsubscribe', { body: JSON.stringify(payload), method: 'POST' }).then(() => undefined),
  }
}

async function requestJson<T>(baseUrl: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new NotificationsRequestError(response.status, await readErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string }
    return payload.error ?? `Notifications request failed with ${response.status}`
  } catch {
    return `Notifications request failed with ${response.status}`
  }
}
