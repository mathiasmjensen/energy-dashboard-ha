import { useEffect, useMemo, useState } from 'react'
import {
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
  const [sessions, setSessions] = useState<EvccChargeSession[]>(() => readEvccChargeSessionCache()?.sessions ?? [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchSessions() {
      const cached = readEvccChargeSessionCache()

      if (cached && Date.now() - cached.createdAt < CACHE_MS) {
        setSessions(cached.sessions)
        return
      }

      try {
        const response = await fetch('http://YOUR_INTERNAL_HOST:7070/api/sessions', {
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
  }, [])

  return useMemo(() => sessions, [sessions])
}
