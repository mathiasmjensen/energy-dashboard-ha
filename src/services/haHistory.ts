export type HaHistoryRequest = {
  accessToken?: string
  apiBase: string
  connection: unknown
  end: Date
  entityIds: string[]
  signal?: AbortSignal
  start: Date
}

type HaHistoryConnection = {
  sendMessagePromise: (message: Record<string, unknown>) => Promise<unknown>
}

/**
 * Uses the existing authenticated HA WebSocket first. Static dashboard files
 * intentionally have no browser token, so REST history cannot authenticate in
 * a production `/local/` deployment.
 */
export async function requestHaHistory({
  accessToken,
  apiBase,
  connection,
  end,
  entityIds,
  signal,
  start,
}: HaHistoryRequest): Promise<unknown> {
  const websocket = getHistoryConnection(connection)
  if (websocket) {
    return websocket.sendMessagePromise({
      end_time: end.toISOString(),
      entity_ids: entityIds,
      minimal_response: true,
      no_attributes: true,
      start_time: start.toISOString(),
      type: 'history/history_during_period',
    })
  }

  const url = `${apiBase}/api/history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${encodeURIComponent(entityIds.join(','))}&end_time=${encodeURIComponent(end.toISOString())}&no_attributes`
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    signal,
  })

  if (!response.ok) {
    throw new Error(`Home Assistant history request failed with ${response.status}`)
  }

  return response.json()
}

export function extractHaHistorySeries(payload: unknown, entityId: string, entityIds: string[] = []): unknown[] {
  if (Array.isArray(payload)) {
    const entityIndex = entityIds.indexOf(entityId)
    const series = entityIndex >= 0 ? payload[entityIndex] : payload[0]
    if (Array.isArray(series)) {
      return series
    }

    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const result = payload as Record<string, unknown>
  const entitySeries = result[entityId]
  if (Array.isArray(entitySeries)) {
    return entitySeries
  }

  const states = result.states
  return Array.isArray(states) ? states : []
}

function getHistoryConnection(connection: unknown): HaHistoryConnection | null {
  if (!connection || typeof connection !== 'object' || !('sendMessagePromise' in connection)) {
    return null
  }

  const sendMessagePromise = connection.sendMessagePromise
  return typeof sendMessagePromise === 'function'
    ? { sendMessagePromise: sendMessagePromise.bind(connection) as HaHistoryConnection['sendMessagePromise'] }
    : null
}
