import { createHash } from 'node:crypto'

export type FoxCloudConfig = {
  apiDomain: string
  apiKey: string
  deviceSn: string
  timezone?: string
}

export type FoxCloudReportDimension = 'day' | 'hour'

export function createFoxCloudSignature(path: string, apiKey: string, timestamp: string) {
  return createHash('md5').update(`${path}\\r\\n${apiKey}\\r\\n${timestamp}`, 'utf8').digest('hex')
}

export function createFoxCloudHeaders({
  apiKey,
  path,
  timezone = 'Europe/Copenhagen',
  timestamp,
}: {
  apiKey: string
  path: string
  timestamp: string
  timezone?: string
}) {
  return {
    'Content-Type': 'application/json',
    Lang: 'en',
    Signature: createFoxCloudSignature(path, apiKey, timestamp),
    Timestamp: timestamp,
    Timezone: timezone,
    Token: apiKey,
    'User-Agent': 'Mozilla/5.0',
  }
}

export async function fetchFoxCloudReport(
  config: FoxCloudConfig,
  {
    day,
    dimension,
    month,
    variables,
    year,
  }: {
    day: number
    dimension: FoxCloudReportDimension
    month: number
    variables: string[]
    year: number
  },
) {
  const path = '/op/v0/device/report/query'
  const timestamp = `${Date.now()}`
  const response = await fetch(`${config.apiDomain.replace(/\/$/, '')}${path}`, {
    body: JSON.stringify({
      day,
      dimension,
      month,
      sn: config.deviceSn,
      variables,
      year,
    }),
    headers: createFoxCloudHeaders({
      apiKey: config.apiKey,
      path,
      timestamp,
      timezone: config.timezone,
    }),
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Fox Cloud request failed with ${response.status}`)
  }

  return (await response.json()) as {
    errno: number
    msg: string
    result?: Array<{
      unit?: string
      values?: unknown[]
      variable?: string
    }>
  }
}
