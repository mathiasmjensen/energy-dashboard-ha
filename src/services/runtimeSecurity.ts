function getEnvValue(key: string) {
  return (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env?.[key]
}

export function isProductionBuild() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> }).env
  return Boolean(env?.PROD) || env?.MODE === 'production'
}

export function isDirectBrowserApiEnabled() {
  return String(getEnvValue('VITE_ENABLE_DIRECT_BROWSER_APIS') ?? '') === 'true'
}

export function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, '')
}

export function resolveBrowserVisibleUrl(url: string) {
  const normalized = normalizeUrl(url)

  if (!normalized) {
    return ''
  }

  if (!isProductionBuild() || isDirectBrowserApiEnabled()) {
    return normalized
  }

  if (typeof window === 'undefined') {
    return normalized
  }

  try {
    const parsed = new URL(normalized, window.location.origin)
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`
    }
  } catch {
    if (normalized.startsWith('/')) {
      return normalized
    }
  }

  return ''
}

export function resolveSafeBrowserHaToken(connectionToken?: string) {
  if (connectionToken?.trim()) {
    return connectionToken.trim()
  }

  const envToken = String(getEnvValue('VITE_HA_TOKEN') ?? '').trim()
  if (!envToken) {
    return undefined
  }

  if (isProductionBuild() && !isDirectBrowserApiEnabled()) {
    return undefined
  }

  return envToken
}
