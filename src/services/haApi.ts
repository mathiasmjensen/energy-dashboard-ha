import { resolveSafeBrowserHaToken, resolveBrowserVisibleUrl } from './runtimeSecurity'

export function resolveHaApiBase() {
  const explicitUrl = import.meta.env.VITE_HA_URL?.trim()

  if (explicitUrl) {
    return resolveBrowserVisibleUrl(explicitUrl)
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function getConnectionAccessToken(connection: unknown) {
  if (!connection || typeof connection !== 'object') {
    return undefined
  }

  const maybeAuth = 'auth' in connection ? connection.auth : undefined
  if (!maybeAuth || typeof maybeAuth !== 'object') {
    return undefined
  }

  return 'accessToken' in maybeAuth && typeof maybeAuth.accessToken === 'string' ? maybeAuth.accessToken : undefined
}

export function resolveHaAccessToken(connection: unknown) {
  return resolveSafeBrowserHaToken(getConnectionAccessToken(connection))
}
