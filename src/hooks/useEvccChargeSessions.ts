import { useEffect, useMemo, useState } from 'react'
import { useHass } from '@hakit/core'
import { resolveEnergyEntities } from '../data/resolveEnergyEntities'
import { getRawEntityState, getResolvedEntity } from '../services/energyEntityFormatting'
import {
  getEvccSessionsFromAttributes,
  getEvccSessionsUrl,
  mapEvccSessions,
  readEvccChargeSessionCache,
  type EvccApiSession,
  type EvccChargeSession,
  writeEvccChargeSessionCache,
} from '../services/evccChargeSessions'

export type { EvccChargeSession } from '../services/evccChargeSessions'

const CACHE_MS = 5 * 60 * 1000
const POLL_MS = 5 * 60 * 1000

export function useEvccChargeSessions() {
  const entities = useHass((state) => state.entities)
  const [sessions, setSessions] = useState<EvccChargeSession[]>(() => readEvccChargeSessionCache()?.sessions ?? [])
  const evccSessionsUrl = getEvccSessionsUrl()
  const resolved = useMemo(() => resolveEnergyEntities(entities), [entities])
  const haSessions = useMemo(() => {
    const entity = getResolvedEntity(resolved, 'evccChargeSessions')

    return getEvccSessionsFromAttributes(
      (entity?.attributes ?? {}) as Record<string, unknown>,
      getRawEntityState(resolved, 'evccChargeSessions'),
    )
  }, [resolved])
  const hasHaSessions = haSessions.length > 0

  useEffect(() => {
    if (!evccSessionsUrl || hasHaSessions) {
      return
    }

    const controller = new AbortController()

    async function fetchSessions() {
      const cached = readEvccChargeSessionCache()

      if (cached && Date.now() - cached.createdAt < CACHE_MS) {
        setSessions(cached.sessions)
        return
      }

      try {
        const response = await fetch(evccSessionsUrl, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`EVCC sessions request failed with ${response.status}`)
        }

        const payload = (await response.json()) as EvccApiSession[]
        const nextSessions = mapEvccSessions(payload)

        setSessions(nextSessions)
        writeEvccChargeSessionCache(nextSessions)
      } catch {
        if (!controller.signal.aborted && cached?.sessions) {
          setSessions(cached.sessions)
        }
      }
    }

    void fetchSessions()

    const pollId = window.setInterval(() => {
      void fetchSessions()
    }, POLL_MS)

    return () => {
      controller.abort()
      window.clearInterval(pollId)
    }
  }, [evccSessionsUrl, hasHaSessions])

  return useMemo(() => (hasHaSessions ? haSessions : sessions), [haSessions, hasHaSessions, sessions])
}
