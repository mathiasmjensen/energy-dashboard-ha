import type { CSSProperties } from 'react'
import {
  getBatteryDirection,
  getEvChargeDirection,
  getFlowState,
  getGridDirection,
  type FlowDirection,
  type FlowState,
} from '../utils/flowDirection'

type EnergyFlowOverlayProps = {
  batteryPowerValue: number | null
  batteryStatus: string
  evChargePowerValue: number | null
  gridPowerValue: number | null
  gridStatus: string
  solarPowerValue: number | null
}

type FlowPathProps = {
  accent: 'cyan' | 'green' | 'yellow'
  delay?: number
  direction?: FlowDirection
  d: string
  markerId: string
  name: string
  state?: FlowState
}

export function EnergyFlowOverlay({
  batteryPowerValue,
  batteryStatus,
  evChargePowerValue,
  gridPowerValue,
  gridStatus,
  solarPowerValue,
}: EnergyFlowOverlayProps) {
  const batteryDirection = getBatteryDirection(batteryStatus, batteryPowerValue)
  const evDirection = getEvChargeDirection(evChargePowerValue)
  const gridDirection = getGridDirection(gridStatus, gridPowerValue)
  const solarState = getFlowState(solarPowerValue)
  const evState = getFlowState(evChargePowerValue)
  const batteryState = getFlowState(batteryPowerValue)
  const gridState = getFlowState(gridPowerValue)
  const evBranchDirection = evState === 'active' ? evDirection : batteryDirection

  return (
    <svg className="energy-flow" viewBox="0 0 1536 864" aria-hidden="true" data-testid="energy-flow-overlay">
      <defs>
        <filter id="flow-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker id="arrow-cyan" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto-start-reverse">
          <path d="M0 1 11 6 0 11Z" fill="#12bfff" />
        </marker>
        <marker id="arrow-green" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto-start-reverse">
          <path d="M0 1 11 6 0 11Z" fill="#3cff4f" />
        </marker>
        <marker id="arrow-yellow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto-start-reverse">
          <path d="M0 1 11 6 0 11Z" fill="#ffd200" />
        </marker>
      </defs>

      <g className="flow-group flow-cyan" filter="url(#flow-glow)" data-flow-source="solar">
        <FlowPath
          accent="cyan"
          d="M602 304H960Q972 304 972 316V432"
          delay={0}
          markerId="arrow-cyan"
          name="solar-to-battery"
          state={solarState}
        />
        <FlowPath
          accent="cyan"
          d="M672 304V560Q672 584 696 584H764"
          delay={0.35}
          markerId="arrow-cyan"
          name="solar-to-home"
          state={solarState}
        />
        <FlowPath
          accent="cyan"
          d="M672 304H828"
          delay={0.7}
          markerId="arrow-cyan"
          name="solar-roof-bus"
          state={solarState}
        />
        <circle className="flow-node" cx="672" cy="304" r="5" />
        <circle className="flow-node" cx="972" cy="328" r="5" />
      </g>

      <g
        className="flow-group flow-green"
        filter="url(#flow-glow)"
        data-flow-source="battery"
        data-direction={batteryDirection}
        data-ev-direction={evDirection}
      >
        <FlowPath
          accent="green"
          d="M995 548V636Q995 648 983 648H648Q636 648 636 636V600H576"
          delay={0.05}
          direction={evBranchDirection}
          markerId="arrow-green"
          name="energy-bus-to-ev-charger"
          state={evState === 'active' ? 'active' : batteryState}
        />
        <FlowPath
          accent="green"
          d="M995 548V504"
          delay={0.5}
          direction={batteryDirection === 'forward' ? 'reverse' : 'forward'}
          markerId="arrow-green"
          name="battery-vertical"
          state={batteryState}
        />
        <FlowPath
          accent="green"
          d="M432 600H336Q316 600 298 611H278"
          delay={0.85}
          direction={evDirection}
          markerId="arrow-green"
          name="ev-charger-to-car"
          state={evState}
        />
        <circle className="flow-node" cx="995" cy="548" r="5" />
      </g>

      <g
        className="flow-group flow-yellow"
        filter="url(#flow-glow)"
        data-flow-source="grid"
        data-direction={gridDirection}
      >
        <FlowPath
          accent="yellow"
          d="M1162 488H1088Q1068 488 1068 508V572"
          delay={0.15}
          direction={gridDirection}
          markerId="arrow-yellow"
          name="grid-to-battery"
          state={gridState}
        />
        <FlowPath
          accent="yellow"
          d="M1068 572V608"
          delay={0.55}
          direction={gridDirection}
          markerId="arrow-yellow"
          name="grid-vertical"
          state={gridState}
        />
        <FlowPath
          accent="yellow"
          d="M1037 608H732Q713 608 713 590"
          delay={0.95}
          direction={gridDirection}
          markerId="arrow-yellow"
          name="grid-to-home"
          state={gridState}
        />
      </g>
    </svg>
  )
}

function FlowPath({
  accent,
  d,
  delay = 0,
  direction = 'forward',
  markerId,
  name,
  state = 'idle',
}: FlowPathProps) {
  const markerProps =
    direction === 'forward'
      ? { markerEnd: `url(#${markerId})` }
      : {
          markerStart: `url(#${markerId})`,
        }

  return (
    <g
      className="flow-path"
      data-accent={accent}
      data-direction={direction}
      data-flow-path={name}
      data-flow-state={state}
      style={{ '--flow-delay': `${delay}s` } as CSSProperties}
    >
      <path className="flow-line-base" d={d} {...markerProps} />
      <path className="flow-line-pulse" d={d} />
      <circle className="flow-particle" r="4">
        <animateMotion
          begin={`${delay}s`}
          calcMode="linear"
          dur={state === 'active' ? '1.65s' : '3s'}
          keyPoints={direction === 'forward' ? '0;1' : '1;0'}
          keyTimes="0;1"
          path={d}
          repeatCount="indefinite"
        />
      </circle>
    </g>
  )
}
