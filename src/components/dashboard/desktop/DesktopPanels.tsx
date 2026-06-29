import { assetPath } from '../../../utils/assetPath'
import type { EnergyPriceInsight, InsightHeaderControls, SolarForecastInsight } from '../../../models/dashboardInsights'
import { cn } from '../../../lib/cn'
import { BarChart, DayWindowControls, type DayHeaderControls, InsightToolbar, Panel, PanelHeader } from './DesktopShared'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import { BatteryVisual } from '../../shared/BatteryVisual'

export function EnergyDistributionPanel({
  battery,
  batteryCharge,
  batteryDischarge,
  controls,
  ev,
  gridExport,
  gridImport,
  home,
  solar,
}: {
  battery: string
  batteryCharge: string
  batteryDischarge: string
  controls: DayHeaderControls
  ev: string
  gridExport: string
  gridImport: string
  home: string
  solar: string
}) {
  return (
    <Panel className="h-[224px] px-4 pb-[14px] pt-6">
      <PanelHeader controls={<DayWindowControls {...controls} />} showPeriod={false} title="Energy distribution" />
      <div className="relative mt-[19px] h-[142px]">
        <div className={desktopDistNodeClassName('solar')}>
          <span className={desktopDistDotClassName('solar')} aria-hidden="true" />
          <div>
            <span className="block text-[10px] leading-[1.1] text-[#c4cad3]">Solar</span>
            <strong className="mt-0.5 block whitespace-nowrap text-[11px] leading-[1.1] text-white">{solar} kWh</strong>
          </div>
        </div>
        <div className={desktopDistNodeClassName('grid')}>
          <span className={desktopDistDotClassName('grid')} aria-hidden="true" />
          <div>
            <span className="block text-[10px] leading-[1.1] text-[#c4cad3]">Grid</span>
            <strong className="mt-0.5 block whitespace-nowrap text-[11px] leading-[1.1] text-white">{gridImport} kWh</strong>
            <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 border-t border-white/6 pt-1.5">
              <span className="text-[9px] leading-[1.15] text-[#95a0af]">From</span>
              <strong className="text-right text-[9px] leading-[1.15] text-[#edf2f7]">{gridImport} kWh</strong>
              <span className="text-[9px] leading-[1.15] text-[#95a0af]">To</span>
              <strong className="text-right text-[9px] leading-[1.15] text-[#edf2f7]">{gridExport} kWh</strong>
            </div>
          </div>
        </div>
        <div className={desktopDistNodeClassName('home')}>
          <span className={desktopDistDotClassName('home')} aria-hidden="true" />
          <div>
            <span className="block text-[10px] leading-[1.1] text-[#c4cad3]">Home</span>
            <strong className="mt-0.5 block whitespace-nowrap text-[11px] leading-[1.1] text-white">{home} kWh</strong>
          </div>
        </div>
        <div className={desktopDistNodeClassName('battery')}>
          <span className={desktopDistDotClassName('battery')} aria-hidden="true" />
          <div>
            <span className="block text-[10px] leading-[1.1] text-[#c4cad3]">Battery</span>
            <strong className="mt-0.5 block whitespace-nowrap text-[11px] leading-[1.1] text-white">{battery} kWh</strong>
            <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 border-t border-white/6 pt-1.5">
              <span className="text-[9px] leading-[1.15] text-[#95a0af]">To</span>
              <strong className="text-right text-[9px] leading-[1.15] text-[#edf2f7]">{batteryCharge} kWh</strong>
              <span className="text-[9px] leading-[1.15] text-[#95a0af]">From</span>
              <strong className="text-right text-[9px] leading-[1.15] text-[#edf2f7]">{batteryDischarge} kWh</strong>
            </div>
          </div>
        </div>
        <div className={desktopDistNodeClassName('ev')}>
          <span className={desktopDistDotClassName('ev')} aria-hidden="true" />
          <div>
            <span className="block text-[10px] leading-[1.1] text-[#c4cad3]">EV</span>
            <strong className="mt-0.5 block whitespace-nowrap text-[11px] leading-[1.1] text-white">{ev} kWh</strong>
          </div>
        </div>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 150" aria-hidden="true">
          <path d="M118 44H184Q204 44 204 62" fill="none" stroke="rgba(245,166,35,0.72)" strokeLinecap="round" strokeWidth="5" />
          <path d="M118 112H184Q204 112 204 88" fill="none" stroke="rgba(166,77,245,0.75)" strokeLinecap="round" strokeWidth="5" />
          <path d="M252 62Q252 44 276 44H348" fill="none" stroke="rgba(51,214,107,0.58)" strokeLinecap="round" strokeWidth="5" />
          <path d="M252 88Q252 112 276 112H348" fill="none" stroke="rgba(166,173,182,0.42)" strokeLinecap="round" strokeWidth="5" />
        </svg>
      </div>
    </Panel>
  )
}

export function SolarProductionPanel({
  controls,
  curve,
  labels,
  value,
}: {
  controls: DayHeaderControls
  curve: number[]
  labels: string[]
  value: string
}) {
  return (
    <Panel className="h-[228px] px-4 py-4">
      <PanelHeader controls={<DayWindowControls {...controls} />} showPeriod={false} title="Solar production" />
      <div className="mt-[18px] flex items-baseline gap-1.5">
        <strong className="text-[27px] leading-none text-white">{value}</strong>
        <span className="text-[16px] font-[720] text-white">kWh</span>
      </div>
      <p className="mt-[7px] text-[12px] text-dashboard-soft">Total production</p>
      <span className="absolute right-[18px] top-[58px] font-[720] text-dashboard-green">^ 12%</span>
      <small className="absolute right-[18px] top-[79px] text-[12px] text-dashboard-soft">vs yesterday</small>
      <BarChart className="production-bars" label="Solar production by hour" labels={labels} unit="kWh" values={curve} />
    </Panel>
  )
}

export function BatteryStatusPanel({
  capacity,
  energy,
  onOpen,
  power,
  soc,
  socValue,
  status,
}: {
  capacity: string
  energy: string
  onOpen?: () => void
  power: string
  soc: string
  socValue: number
  status: string
}) {
  const timeEstimate = getBatteryTimeEstimate({
    capacityKwh: parseDisplayNumber(capacity),
    powerKw: parseDisplayNumber(power),
    socPercent: socValue,
    status,
    storedEnergyKwh: parseDisplayNumber(energy),
  })

  return (
    <Panel className="h-[188px] px-[18px] pb-[14px] pt-[17px]">
      <h2 className="m-0 text-[18px] font-[780] leading-none text-white">Battery status</h2>
      <button
        aria-label="Open battery details"
        className="w-full rounded-[18px] bg-transparent p-0 text-left text-inherit transition hover:brightness-105 focus-visible:brightness-105"
        type="button"
        onClick={onOpen}
      >
        <div className="mt-[9px] grid grid-cols-[1fr_112px_1fr] items-center gap-3">
          <div>
            <strong className="block text-[27px] leading-[1.08] text-white">{soc}</strong>
            <span className="mb-[11px] mt-[3px] block text-[12px] leading-[1.15] text-[#c7cdd6]">State of charge</span>
            <strong className="block text-[21px] leading-[1.08] text-white">{energy} kWh</strong>
            <span className="mb-[11px] mt-[3px] block text-[12px] leading-[1.15] text-[#c7cdd6]">Stored energy</span>
          </div>
          <BatteryVisual level={socValue} />
          <div data-status={status.toLowerCase()}>
            <span
              className={cn(
                'mb-[11px] mt-[3px] block text-[12px] leading-[1.15]',
                status.toLowerCase() === 'charging' || status.toLowerCase() === 'discharging'
                  ? 'font-[720] text-[#ff6b73]'
                  : 'font-[680] text-white',
              )}
            >
              {status}
            </span>
            <strong className="block text-[21px] leading-[1.08] text-white">{power} kW</strong>
            <span className="mb-[11px] mt-[3px] block text-[12px] leading-[1.15] text-[#c7cdd6]">{timeEstimate.label}</span>
            <strong className="block text-[21px] leading-[1.08] text-white">{timeEstimate.value}</strong>
          </div>
        </div>
      </button>
    </Panel>
  )
}

export function VehiclePanel({ battery, range }: { battery: string; range: string }) {
  return (
    <Panel className="h-[162px] px-4 py-[17px]">
      <h2 className="m-0 text-[18px] font-[780] leading-none text-white">Vehicle</h2>
      <img
        className="absolute left-[130px] top-[22px] h-[112px] w-[238px] object-contain"
        src={assetPath('/new-energy-dashboard/car.png')}
        alt="Electric vehicle"
      />
      <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-[5px]">
        <span className="text-[11px] text-dashboard-soft">Status</span>
        <span className="text-[11px] text-dashboard-soft">Battery</span>
        <span className="text-[11px] text-dashboard-soft">Range</span>
        <strong className="text-[12px] text-white">Parked</strong>
        <strong className="text-[12px] text-white">{battery}</strong>
        <strong className="text-[12px] text-white">{range}</strong>
      </div>
    </Panel>
  )
}

export function SolarForecastCard({
  controls,
  insight,
}: {
  controls: InsightHeaderControls
  insight: SolarForecastInsight
}) {
  return (
    <Panel className="grid h-[264px] grid-rows-[auto_auto_auto_minmax(90px,1fr)] gap-2 px-[14px] pb-3 pt-[14px]">
      <PanelHeader showPeriod={false} title="Solar forecast" />
      <InsightToolbar controls={controls} windowLabel={insight.windowLabel} />
      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-end gap-2">
        <div className="grid gap-1">
          <div className="flex items-baseline gap-1.5">
            <strong className="text-[27px] leading-none text-white">{insight.totalKwh}</strong>
            <span className="text-[16px] font-[720] text-white">kWh</span>
          </div>
          <p className="m-0 text-[12px] leading-[1.2] text-[#c5ccd7]">{insight.primaryLabel}</p>
        </div>
        {insight.summaryItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {insight.summaryItems.map((item) => (
              <div className="grid min-h-[36px] gap-[3px] rounded-lg border border-white/6 bg-[#060a10]/56 px-2 py-1.5" key={item.label}>
                <span className="text-[10px] leading-[1.1] text-[#9da7b5]">{item.label}</span>
                <strong className="whitespace-nowrap text-[12px] leading-[1.1] text-white">{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative min-h-[90px] rounded-[10px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),rgba(8,12,18,0.58)] px-[6px] pb-0.5 pt-1">
        <BarChart
          className="insight-bar-chart insight-bar-chart--solar"
          label="Solar forecast by hour"
          labels={insight.pointLabels}
          unit="kWh"
          values={insight.points}
        />
      </div>
    </Panel>
  )
}

export function EnergyPricesCard({
  controls,
  insight,
}: {
  controls: InsightHeaderControls
  insight: EnergyPriceInsight
}) {
  return (
    <Panel className="grid h-[264px] grid-rows-[auto_auto_auto_minmax(90px,1fr)] gap-2 px-[14px] pb-3 pt-[14px]">
      <PanelHeader showPeriod={false} title="Energy prices" />
      <InsightToolbar controls={controls} windowLabel={insight.windowLabel} />
      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-end gap-2">
        <div className="grid gap-1">
          <div className="flex items-baseline gap-1.5">
            <strong className="text-[27px] leading-none text-white">{insight.primaryValue}</strong>
            <span className="text-[16px] font-[720] text-white">DKK/kWh</span>
          </div>
          <p className="m-0 text-[12px] leading-[1.2] text-[#c5ccd7]">{insight.primaryLabel}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {insight.summaryItems.map((item) => (
            <div className="grid min-h-[36px] gap-[3px] rounded-lg border border-white/6 bg-[#060a10]/56 px-2 py-1.5" key={item.label}>
              <span className="text-[10px] leading-[1.1] text-[#9da7b5]">{item.label}</span>
              <strong className="whitespace-nowrap text-[12px] leading-[1.1] text-white">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-h-[90px] rounded-[10px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),rgba(8,12,18,0.58)] px-[6px] pb-0.5 pt-1">
        <BarChart
          className="insight-bar-chart insight-bar-chart--prices"
          label="Energy prices by hour"
          labels={insight.pointLabels}
          unit="DKK/kWh"
          values={insight.points}
        />
      </div>
    </Panel>
  )
}

export function EvChargerOverviewCard({
  battery,
  chargeRate,
  onOpen,
  range,
  status,
}: {
  battery: string
  chargeRate: string
  onOpen: () => void
  range: string
  status: string
}) {
  return (
    <button
      aria-label="Open EV charger details"
      className="dashboard-glass-panel relative block h-[264px] cursor-pointer px-4 pb-[18px] pt-[18px] text-left transition hover:border-dashboard-blue/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dashboard-blue"
      type="button"
      onClick={onOpen}
    >
      <PanelHeader showPeriod={false} title="EV Charger" />
      <span className="mt-3 block text-[14px] text-dashboard-soft">{status}</span>
      <img
        className="absolute right-1 top-[47px] h-[158px] w-[118px] object-contain"
        src={assetPath('/new-energy-dashboard/charger.png')}
        alt="Wall mounted EV charger"
      />
      <div className="absolute bottom-5 left-4 grid w-[145px] grid-cols-2 gap-x-4 gap-y-[6px]">
        <span className="text-[11px] text-dashboard-soft">Vehicle</span>
        <strong className="text-[12px] text-white">Tesla Model Y</strong>
        <span className="text-[11px] text-dashboard-soft">Battery</span>
        <strong className="text-[12px] text-white">{battery}</strong>
        <span className="text-[11px] text-dashboard-soft">Range</span>
        <strong className="text-[12px] text-white">{range} km</strong>
        <span className="text-[11px] text-dashboard-soft">Power</span>
        <strong className="text-[12px] text-white">{chargeRate} kW</strong>
      </div>
    </button>
  )
}

function desktopDistNodeClassName(tone: 'battery' | 'ev' | 'grid' | 'home' | 'solar') {
  return cn(
    'absolute z-[1] grid items-center gap-x-2 rounded-lg border border-white/[0.075] bg-[linear-gradient(180deg,rgba(255,255,255,0.052),rgba(255,255,255,0.012)),rgba(4,8,13,0.9)] px-[9px] py-[6px] shadow-[0_9px_20px_rgba(0,0,0,0.26)]',
    tone === 'home'
      ? 'left-1/2 top-[47px] min-h-[38px] min-w-[94px] -translate-x-1/2 grid-cols-[9px_1fr] justify-items-start text-left text-dashboard-blue'
      : 'min-h-[36px] min-w-[122px] grid-cols-[9px_minmax(78px,1fr)]',
    tone === 'solar' && 'left-2 top-[14px] text-dashboard-orange',
    tone === 'grid' && 'bottom-[9px] left-2 text-dashboard-purple',
    tone === 'battery' && 'right-2 top-[14px] text-dashboard-green',
    tone === 'ev' && 'bottom-[9px] right-2 text-[#d6dce3]',
  )
}

function desktopDistDotClassName(tone: 'battery' | 'ev' | 'grid' | 'home' | 'solar') {
  return cn(
    'mt-[5px] block h-[7px] w-[7px] self-start rounded-full shadow-[0_0_10px_currentColor]',
    tone === 'solar' && 'bg-dashboard-orange text-dashboard-orange',
    tone === 'grid' && 'bg-dashboard-purple text-dashboard-purple',
    tone === 'home' && 'bg-dashboard-blue text-dashboard-blue',
    tone === 'battery' && 'bg-dashboard-green text-dashboard-green',
    tone === 'ev' && 'bg-[#d6dce3] text-[#d6dce3]',
  )
}
