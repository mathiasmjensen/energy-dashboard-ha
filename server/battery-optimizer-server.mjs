import { mkdir } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildOptimizerSnapshot,
  createDefaultServerState,
  createSyntheticPriceWindows,
  createSyntheticSolarForecast,
  loadJsonFile,
  mergeSettings,
  normalizeLiveStatus,
  normalizePriceWindows,
  normalizeSolarForecast,
  saveJsonFile,
} from './battery-optimizer-core.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultStatePath = path.resolve(__dirname, '../server-data/battery-optimizer-state.json')

const config = {
  ha: {
    batteryPowerEntity: process.env.BATTERY_OPTIMIZER_BATTERY_POWER_ENTITY || '',
    batterySocEntity: process.env.BATTERY_OPTIMIZER_BATTERY_SOC_ENTITY || '',
    gridPowerEntity: process.env.BATTERY_OPTIMIZER_GRID_POWER_ENTITY || '',
    homePowerEntity: process.env.BATTERY_OPTIMIZER_HOME_POWER_ENTITY || '',
    solarPowerEntity: process.env.BATTERY_OPTIMIZER_SOLAR_POWER_ENTITY || '',
    token: process.env.BATTERY_OPTIMIZER_HA_TOKEN || '',
    url: trimUrl(process.env.BATTERY_OPTIMIZER_HA_URL || ''),
  },
  port: Number(process.env.BATTERY_OPTIMIZER_PORT || 8090),
  pricing: {
    addOnDkk: Number(process.env.BATTERY_OPTIMIZER_BUY_ADDON_DKK || 0.42),
    url: process.env.BATTERY_OPTIMIZER_PRICE_URL || '',
  },
  solar: {
    url: process.env.BATTERY_OPTIMIZER_SOLAR_FORECAST_URL || '',
  },
  statePath: process.env.BATTERY_OPTIMIZER_STATE_PATH || defaultStatePath,
  tariffs: {
    sellDeductionDkk: Number(process.env.BATTERY_OPTIMIZER_SELL_DEDUCTION_DKK || 0.16),
  },
}

await mkdir(path.dirname(config.statePath), { recursive: true })

let serverState = await loadJsonFile(config.statePath, createDefaultServerState())
serverState = {
  ...createDefaultServerState(),
  ...serverState,
  settings: mergeSettings(createDefaultServerState().settings, serverState.settings ?? {}),
}

const server = http.createServer(async (request, response) => {
  try {
    setCorsHeaders(response)

    if (request.method === 'OPTIONS') {
      response.writeHead(204)
      response.end()
      return
    }

    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
    const route = `${request.method ?? 'GET'} ${url.pathname}`

    if (route === 'GET /api/battery/status') {
      const snapshot = await ensureSnapshot()
      return sendJson(response, 200, snapshot.status)
    }

    if (route === 'GET /api/battery/plan') {
      const snapshot = await ensureSnapshot()
      return sendJson(response, 200, {
        charts: snapshot.charts,
        decisionSummary: snapshot.decisionSummary,
        rows: snapshot.planRows,
        updatedAt: snapshot.status.updatedAt,
      })
    }

    if (route === 'GET /api/battery/settings') {
      return sendJson(response, 200, serverState.settings)
    }

    if (route === 'POST /api/battery/refresh') {
      const snapshot = await refreshSnapshot()
      return sendJson(response, 200, {
        ok: true,
        updatedAt: snapshot.status.updatedAt,
      })
    }

    if (route === 'POST /api/battery/apply-plan') {
      const body = await readJsonBody(request)
      serverState.appliedPlan = {
        appliedAt: new Date().toISOString(),
        planRows: Array.isArray(body?.planRows) ? body.planRows : [],
        settings: body?.settings && typeof body.settings === 'object' ? body.settings : serverState.settings,
      }
      await persistState()
      return sendJson(response, 200, {
        appliedAt: serverState.appliedPlan.appliedAt,
        ok: true,
      })
    }

    if (route === 'POST /api/battery/settings') {
      const body = await readJsonBody(request)
      serverState.settings = mergeSettings(serverState.settings, body)
      serverState.cachedSnapshot = null
      await persistState()
      const snapshot = await ensureSnapshot()
      return sendJson(response, 200, {
        ok: true,
        settings: snapshot.settings,
      })
    }

    if (route === 'POST /api/battery/pause') {
      const body = await readJsonBody(request)
      const untilIso =
        typeof body?.untilIso === 'string' && Number.isFinite(Date.parse(body.untilIso))
          ? body.untilIso
          : tomorrowStartIso()
      serverState.settings = mergeSettings(serverState.settings, { pausedUntil: untilIso })
      serverState.cachedSnapshot = null
      await persistState()
      return sendJson(response, 200, {
        ok: true,
        pausedUntil: untilIso,
      })
    }

    if (route === 'GET /health') {
      return sendJson(response, 200, {
        cachedAt: serverState.cachedSnapshot?.status?.updatedAt ?? null,
        ok: true,
      })
    }

    sendJson(response, 404, { error: 'Not found' })
  } catch (error) {
    console.error('[battery-optimizer]', error)
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected server error',
    })
  }
})

server.listen(config.port, () => {
  console.log(`[battery-optimizer] listening on http://0.0.0.0:${config.port}`)
})

async function ensureSnapshot() {
  if (serverState.cachedSnapshot) {
    return serverState.cachedSnapshot
  }

  return refreshSnapshot()
}

async function refreshSnapshot() {
  const nowMs = Date.now()
  const [liveStatus, priceWindows, solarForecastWindows] = await Promise.all([
    fetchLiveStatus().catch(() => normalizeLiveStatus({})),
    fetchPriceWindows().catch(() => createSyntheticPriceWindows(nowMs)),
    fetchSolarForecastWindows().catch(() => createSyntheticSolarForecast(nowMs)),
  ])

  serverState.cachedSnapshot = buildOptimizerSnapshot({
    liveStatus,
    nowMs,
    priceAdjustmentDkk: config.pricing.addOnDkk,
    priceWindows,
    sellAdjustmentDkk: config.tariffs.sellDeductionDkk,
    serverState,
    solarForecastWindows,
  })

  await persistState()
  return serverState.cachedSnapshot
}

async function fetchLiveStatus() {
  if (!config.ha.url || !config.ha.token) {
    return normalizeLiveStatus({})
  }

  const [batterySocEntity, batteryPowerEntity, gridPowerEntity, homePowerEntity, solarPowerEntity] = await Promise.all([
    fetchHaEntityState(config.ha.batterySocEntity),
    fetchHaEntityState(config.ha.batteryPowerEntity),
    fetchHaEntityState(config.ha.gridPowerEntity),
    fetchHaEntityState(config.ha.homePowerEntity),
    fetchHaEntityState(config.ha.solarPowerEntity),
  ])

  return normalizeLiveStatus({
    batteryPowerKw: batteryPowerEntity?.state,
    batterySocPercent: batterySocEntity?.state,
    gridPowerKw: gridPowerEntity?.state,
    homePowerKw: homePowerEntity?.state,
    solarPowerKw: solarPowerEntity?.state,
  })
}

async function fetchHaEntityState(entityId) {
  if (!entityId) {
    return null
  }

  const response = await fetch(`${config.ha.url}/api/states/${encodeURIComponent(entityId)}`, {
    headers: {
      Authorization: `Bearer ${config.ha.token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HA entity fetch failed for ${entityId} with ${response.status}`)
  }

  return response.json()
}

async function fetchPriceWindows() {
  if (!config.pricing.url) {
    return []
  }

  const response = await fetch(config.pricing.url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Price endpoint failed with ${response.status}`)
  }

  const payload = await response.json()
  return normalizePriceWindows(payload)
}

async function fetchSolarForecastWindows() {
  if (!config.solar.url) {
    return []
  }

  const response = await fetch(config.solar.url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Solar forecast endpoint failed with ${response.status}`)
  }

  const payload = await response.json()
  return normalizeSolarForecast(payload)
}

async function persistState() {
  await saveJsonFile(config.statePath, serverState)
}

async function readJsonBody(request) {
  const chunks = []
  for await (const chunk of request) {
    chunks.push(chunk)
  }

  if (!chunks.length) {
    return null
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Cache-Control', 'no-store')
}

function tomorrowStartIso() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow.toISOString()
}

function trimUrl(value) {
  return value.replace(/\/$/, '')
}
