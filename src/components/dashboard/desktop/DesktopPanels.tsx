import { assetPath } from '../../../utils/assetPath'
import type { DataStateBadgeModel } from '../../../models/dataState'
import type { EnergyPriceInsight, InsightHeaderControls, SolarForecastInsight } from '../../../models/dashboardInsights'
import { cn } from '../../../lib/cn'
import { BarChart, DataStateBadge, DayWindowControls, type DayHeaderControls, InsightToolbar, Panel, PanelHeader } from './DesktopShared'
import { getBatteryTimeEstimate, parseDisplayNumber } from '../../../services/batteryMetrics'
import { BatteryVisual } from '../../shared/BatteryVisual'

export function EnergyDistributionPanel({
  battery,
  batteryCharge,
  batteryDischarge,
  badge,
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
  badge?: DataStateBadgeModel
  controls: DayHeaderControls
  ev: string
  gridExport: string
  gridImport: string
  home: string
  solar: string
}) {
  return (
    <Panel className="h-[232px] px-4 pb-[14px] pt-6">
      <PanelHeader badge={badge} controls={<DayWindowControls {...controls} />} showPeriod={false} title="Energy distribution" />
      <div className="relative mt-[17px] h-[152px]">
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
            <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-white/6 pt-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[8.5px] leading-none text-[#cbd2dc]">
                <span className="text-[#95a0af]">From</span>
                <strong className="font-semibold text-[#edf2f7]">{gridImport}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[8.5px] leading-none text-[#cbd2dc]">
                <span className="text-[#95a0af]">To</span>
                <strong className="font-semibold text-[#edf2f7]">{gridExport}</strong>
              </span>
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
            <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-white/6 pt-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[8.5px] leading-none text-[#cbd2dc]">
                <span className="text-[#95a0af]">To</span>
                <strong className="font-semibold text-[#edf2f7]">{batteryCharge}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[8.5px] leading-none text-[#cbd2dc]">
                <span className="text-[#95a0af]">From</span>
                <strong className="font-semibold text-[#edf2f7]">{batteryDischarge}</strong>
              </span>
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
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 420 154" aria-hidden="true">
          <path d="M120 42H176Q192 42 192 60" fill="none" stroke="rgba(245,166,35,0.68)" strokeLinecap="round" strokeWidth="4" />
          <path d="M120 116H176Q192 116 192 94" fill="none" stroke="rgba(166,77,245,0.72)" strokeLinecap="round" strokeWidth="4" />
          <path d="M228 60Q228 42 248 42H292" fill="none" stroke="rgba(51,214,107,0.54)" strokeLinecap="round" strokeWidth="4" />
          <path d="M228 94Q228 116 248 116H292" fill="none" stroke="rgba(166,173,182,0.38)" strokeLinecap="round" strokeWidth="4" />
        </svg>
      </div>
    </Panel>
  )
}

export function SolarProductionPanel({
  badge,
  controls,
  curve,
  labels,
  value,
}: {
  badge?: DataStateBadgeModel
  controls: DayHeaderControls
  curve: number[]
  labels: string[]
  value: string
}) {
  return (
    <Panel className="h-[228px] px-4 py-4">
      <PanelHeader badge={badge} controls={<DayWindowControls {...controls} />} showPeriod={false} title="Solar production" />
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
  badge,
  capacity,
  energy,
  onOpen,
  power,
  soc,
  socValue,
  status,
}: {
  badge?: DataStateBadgeModel
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-[18px] font-[780] leading-none text-white">Battery status</h2>
          {badge ? <span className="shrink-0"><DataStateBadge badge={badge} /></span> : null}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dashboard-soft">
          View details
          <span aria-hidden="true">+</span>
        </span>
      </div>
      <button
        aria-label="Open battery details"
        className="w-full cursor-pointer rounded-[18px] bg-transparent p-0 text-left text-inherit transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:-translate-y-0.5 focus-visible:brightness-105"
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
  badge,
  controls,
  insight,
}: {
  badge?: DataStateBadgeModel
  controls: InsightHeaderControls
  insight: SolarForecastInsight
}) {
  return (
    <Panel className="grid h-[264px] grid-rows-[auto_auto_auto_minmax(90px,1fr)] gap-2 px-[14px] pb-3 pt-[14px]">
      <PanelHeader badge={badge} showPeriod={false} title="Solar forecast" />
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
  badge,
  controls,
  insight,
}: {
  badge?: DataStateBadgeModel
  controls: InsightHeaderControls
  insight: EnergyPriceInsight
}) {
  return (
    <Panel className="grid h-[264px] grid-rows-[auto_auto_auto_minmax(90px,1fr)] gap-2 px-[14px] pb-3 pt-[14px]">
      <PanelHeader badge={badge} showPeriod={false} title="Energy prices" />
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
    'absolute z-[1] grid items-start gap-x-2 overflow-hidden rounded-lg border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.01)),rgba(6,10,16,0.97)] px-[8px] py-[6px] shadow-[0_9px_20px_rgba(0,0,0,0.3)] backdrop-blur-md',
    tone === 'home'
      ? 'left-1/2 top-[47px] min-h-[42px] min-w-[102px] -translate-x-1/2 grid-cols-[9px_1fr] justify-items-start text-left text-dashboard-blue'
      : 'min-h-[40px] w-[118px] grid-cols-[9px_minmax(0,1fr)]',
    tone === 'solar' && 'left-1 top-[10px] text-dashboard-orange',
    tone === 'grid' && 'bottom-[5px] left-1 text-dashboard-purple',
    tone === 'battery' && 'right-1 top-[10px] text-dashboard-green',
    tone === 'ev' && 'bottom-[5px] right-1 text-[#d6dce3]',
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
