import {
  getBatteryOptimizerBaseUrl,
  getBatteryOptimizerMode,
} from './batteryOptimizer'
import type {
  BatteryOptimizerApiPlanPayload,
  BatteryOptimizerApiSettingsPayload,
  BatteryOptimizerApiStatusPayload,
  BatteryOptimizerClient,
  BatteryOptimizerPath,
} from '../models/batteryOptimizer'

export class BatteryOptimizerRequestError extends Error {
  status: number

  constructor(status: number, message?: string) {
    super(message ?? `Battery optimizer request failed with ${status}`)
    this.name = 'BatteryOptimizerRequestError'
    this.status = status
  }
}

export function createBatteryOptimizerClient(): BatteryOptimizerClient | null {
  const mode = getBatteryOptimizerMode()

  if (mode === 'mock') {
    return null
  }

  const baseUrl = mode === 'direct-api' ? getBatteryOptimizerBaseUrl() : ''

  return {
    applyPlan: (payload) => requestJson<void>(baseUrl, '/api/battery/apply-plan', { body: payload, method: 'POST' }).then(() => undefined),
    getPlan: () => requestJson<BatteryOptimizerApiPlanPayload>(baseUrl, '/api/battery/plan'),
    getSettings: () => requestJson<BatteryOptimizerApiSettingsPayload>(baseUrl, '/api/battery/settings'),
    getStatus: () => requestJson<BatteryOptimizerApiStatusPayload>(baseUrl, '/api/battery/status'),
    pauseUntilTomorrow: (payload) => requestJson<void>(baseUrl, '/api/battery/pause', { body: payload, method: 'POST' }).then(() => undefined),
    refresh: () => requestJson<void>(baseUrl, '/api/battery/refresh', { method: 'POST' }).then(() => undefined),
    saveSettings: (payload) => requestJson<void>(baseUrl, '/api/battery/settings', { body: payload, method: 'POST' }).then(() => undefined),
  }
}

async function requestJson<TResult>(
  baseUrl: string,
  path: BatteryOptimizerPath,
  init?: { body?: unknown; method?: 'GET' | 'POST' },
): Promise<TResult> {
  const response = await fetch(`${baseUrl}${path}`, {
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    method: init?.method ?? 'GET',
  })

  if (!response.ok) {
    throw new BatteryOptimizerRequestError(response.status)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return {} as TResult
  }

  const payload: unknown = await response.json()
  return unwrapPayload<TResult>(payload)
}

function unwrapPayload<TResult>(payload: unknown): TResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload as TResult
  }

  const record = payload as Record<string, unknown>
  return (record.data ?? record.result ?? payload) as TResult
}
