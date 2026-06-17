import { EnergyIcon } from './EnergyIcon'
import { GlassPanel } from './GlassPanel'

type BatteryPanelProps = {
  batteryEnergy: string
  batteryPower: string
  batterySoc: string
  batterySocValue: number
  batteryStatus: string
}

export function BatteryPanel({
  batteryEnergy,
  batteryPower,
  batterySoc,
  batterySocValue,
  batteryStatus,
}: BatteryPanelProps) {
  return (
    <GlassPanel accent="green" className="battery-panel">
      <header>
        <EnergyIcon name="battery" />
        <h2>Battery</h2>
      </header>

      <section>
        <p>State of Charge</p>
        <div className="battery-value">
          <span>{batterySoc}</span>
          <small>%</small>
        </div>
        <div className="battery-bar">
          <i style={{ width: `${batterySocValue}%` }} />
        </div>
      </section>

      <section>
        <p>Stored Energy</p>
        <div className="battery-value">
          <span>{batteryEnergy}</span>
          <small>kWh</small>
        </div>
      </section>

      <section>
        <p>Power</p>
        <div className="battery-value">
          <span>{batteryPower}</span>
          <small>kW</small>
        </div>
        <strong>{batteryStatus}</strong>
      </section>
    </GlassPanel>
  )
}
