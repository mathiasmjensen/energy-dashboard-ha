export type FlowDirection = 'forward' | 'reverse'
export type FlowState = 'active' | 'idle'

export const ACTIVE_FLOW_THRESHOLD = 0.05

export function getFlowState(value: number | null): FlowState {
  if (value === null) {
    return 'idle'
  }

  return Math.abs(value) > ACTIVE_FLOW_THRESHOLD ? 'active' : 'idle'
}

export function getBatteryDirection(status: string, value: number | null): FlowDirection {
  if (value !== null && Math.abs(value) > ACTIVE_FLOW_THRESHOLD) {
    return value > 0 ? 'forward' : 'reverse'
  }

  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('discharg')) {
    return 'forward'
  }

  if (normalizedStatus.includes('charg')) {
    return 'reverse'
  }

  return 'forward'
}

export function getEvChargeDirection(value: number | null): FlowDirection {
  if (value !== null && value < -ACTIVE_FLOW_THRESHOLD) {
    return 'reverse'
  }

  return 'forward'
}

export function getGridDirection(status: string, value: number | null): FlowDirection {
  if (value !== null && Math.abs(value) > ACTIVE_FLOW_THRESHOLD) {
    return value > 0 ? 'forward' : 'reverse'
  }

  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes('export')) {
    return 'reverse'
  }

  if (normalizedStatus.includes('import')) {
    return 'forward'
  }

  return 'forward'
}
