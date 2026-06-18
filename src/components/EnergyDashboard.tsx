import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { DesktopDashboard } from './dashboard/desktop/DesktopDashboard'
import {
  appendUnit,
  createFallbackPriceDay,
  FALLBACK_PRICE_CURVE,
  FALLBACK_SOLAR_CURVE,
  getEnergyPriceInsight,
  getSolarForecastInsight,
  type InsightViewMode,
} from './dashboard/dashboardInsights'
import { MobileDashboard } from './mobile/MobileDashboard'
import { useEnergyData } from '../hooks/useEnergyData'
import { useEvChargerController } from '../hooks/useEvChargerController'
import { useIsMobileView } from '../hooks/useIsMobileView'
import { usePeakRates } from '../hooks/usePeakRates'
import { useSceneScale } from '../hooks/useSceneScale'
import { useSolarForecast } from '../hooks/useSolarForecast'
import { useTodayEnergyTotals } from '../hooks/useTodayEnergyTotals'
import './EnergyDashboard.css'

const DESIGN_WIDTH = 1672
const DESIGN_HEIGHT = 941

export function EnergyDashboard() {
  const scale = useSceneScale()
  const isMobileView = useIsMobileView()
  const data = useEnergyData()
  const peakRates = usePeakRates()
  const solarForecast = useSolarForecast()
  const todayTotals = useTodayEnergyTotals()
  const [isEvChargerOpen, setIsEvChargerOpen] = useState(false)
  const [insightDayOffset, setInsightDayOffset] = useState(0)
  const [insightViewMode, setInsightViewMode] = useState<InsightViewMode>('today')
  const [now, setNow] = useState(() => new Date())
  const openEvCharger = useCallback(() => setIsEvChargerOpen(true), [])
  const closeEvCharger = useCallback(() => setIsEvChargerOpen(false), [])

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(clockId)
  }, [])

  const shellStyle = {
    width: `${DESIGN_WIDTH * scale}px`,
    height: `${DESIGN_HEIGHT * scale}px`,
  }
  const sceneStyle = {
    transform: `scale(${scale})`,
  } satisfies CSSProperties

  const solarForecastKwh = solarForecast.todayKwh ?? data.solarForecastToday
  const solarProductionEnergyKwh = data.solarProductionToday === '---' ? solarForecastKwh : data.solarProductionToday
  const solarPowerCurve = solarForecast.hourlyPowerKw.some((value) => value > 0)
    ? solarForecast.hourlyPowerKw
    : FALLBACK_SOLAR_CURVE
  const fallbackPriceDay = createFallbackPriceDay(now)
  const priceDays = peakRates.days.length ? peakRates.days : [fallbackPriceDay]
  const priceCurve = peakRates.hourlyPrices.length ? peakRates.hourlyPrices : FALLBACK_PRICE_CURVE
  const hasPeakRateWindows = peakRates.windows.length > 0
  const fallbackCurrentPrice = fallbackPriceDay.prices[now.getHours()]?.price.toFixed(2) ?? data.peakRateNow
  const averagePrice = peakRates.average ?? (hasPeakRateWindows ? '---' : fallbackPriceDay.average ?? data.peakRateNow)
  const currentPrice = peakRates.now ?? (hasPeakRateWindows ? '---' : fallbackCurrentPrice)
  const peakPrice = peakRates.peak ?? (hasPeakRateWindows ? '---' : fallbackPriceDay.peak ?? data.peakRateNext)
  const displayDate = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
  const displayTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const batterySoc = appendUnit(data.batterySoc, '%')
  const evSoc = appendUnit(data.evChargePercent, '%')
  const batteryFlowMeta = [data.batteryStatus, batterySoc !== '---' ? batterySoc : null].filter(Boolean).join(' · ')
  const insightControls = {
    canGoNext: true,
    canGoPrevious: true,
    mode: insightViewMode,
    onNext: () => setInsightDayOffset((current) => current + 1),
    onPrevious: () => setInsightDayOffset((current) => current - 1),
    onToggleMode: () => {
      setInsightViewMode((current) => (current === 'today' ? 'timeline' : 'today'))
      setInsightDayOffset(0)
    },
  }
  const solarForecastInsight = getSolarForecastInsight({
    fallbackValues: solarPowerCurve,
    mode: insightViewMode,
    now,
    offsetDays: insightDayOffset,
    source: solarForecast.source,
    windows: solarForecast.windows,
  })
  const energyPriceInsight = getEnergyPriceInsight({
    currentPrice,
    fallbackValues: priceCurve,
    mode: insightViewMode,
    now,
    offsetDays: insightDayOffset,
    windows: peakRates.windows,
  })
  const evController = useEvChargerController({
    chargeMode: data.evccChargeMode,
    chargeModeOptions: data.evccChargeModeOptions,
    chargePlanEnabled: data.evccChargePlanEnabled,
    chargePlanFrom: data.evccChargePlanFrom,
    chargePlanTo: data.evccChargePlanTo,
    priceAverage: averagePrice,
    priceCurrent: currentPrice,
    priceDays,
    pricePeak: peakPrice,
    priceSeries: priceCurve,
  })

  if (isMobileView) {
    return (
      <MobileDashboard
        battery={{
          energy: data.batteryEnergy,
          power: data.batteryPower,
          soc: data.batterySoc,
          socValue: data.batterySocValue,
          status: data.batteryStatus,
        }}
        charger={{
          chargeRate: data.evChargePower,
          sessionDuration: data.evChargeSessionDuration,
          sessionEnergy: data.evChargeSessionEnergy,
          status: data.evChargeStatus,
        }}
        controller={evController}
        displayDate={displayDate}
        displayTime={displayTime}
        distribution={{
          battery: data.batteryEnergy,
          ev: todayTotals.evKwh,
          grid: todayTotals.gridKwh,
          home: todayTotals.homeKwh,
          solar: solarProductionEnergyKwh,
        }}
        overview={{
          batteryMeta: batteryFlowMeta,
          batteryPower: data.batteryPower,
          evMeta: data.evChargeStatus,
          evPower: data.evChargePower,
          gridMeta: data.gridStatus,
          gridPower: data.gridPower,
          homePower: data.homePower,
          solarPower: data.solarPower,
        }}
        prices={energyPriceInsight}
        solarForecast={solarForecastInsight}
        solarProduction={{
          curve: solarPowerCurve,
          value: solarProductionEnergyKwh,
        }}
      />
    )
  }

  return (
    <DesktopDashboard
      battery={{
        energy: data.batteryEnergy,
        meta: batteryFlowMeta,
        power: data.batteryPower,
        powerValue: data.batteryPowerValue,
        soc: batterySoc,
        socValue: data.batterySocValue,
        status: data.batteryStatus,
      }}
      charger={{
        battery: evSoc,
        chargeRate: data.evChargePower,
        powerValue: data.evChargePowerValue,
        range: '---',
        sessionDuration: data.evChargeSessionDuration,
        sessionEnergy: data.evChargeSessionEnergy,
        status: data.evChargeStatus,
      }}
      controller={evController}
      displayDate={displayDate}
      displayTime={displayTime}
      distribution={{
        battery: data.batteryEnergy,
        ev: todayTotals.evKwh,
        grid: todayTotals.gridKwh,
        home: todayTotals.homeKwh,
        solar: solarProductionEnergyKwh,
      }}
      grid={{
        power: data.gridPower,
        powerValue: data.gridPowerValue,
        status: data.gridStatus,
      }}
      homePower={data.homePower}
      insightControls={insightControls}
      isEvChargerOpen={isEvChargerOpen}
      onCloseEvCharger={closeEvCharger}
      onOpenEvCharger={openEvCharger}
      prices={energyPriceInsight}
      sceneStyle={sceneStyle}
      shellStyle={shellStyle}
      solar={{
        forecast: solarForecastInsight,
        power: data.solarPower,
        production: {
          curve: solarPowerCurve,
          value: solarProductionEnergyKwh,
        },
      }}
    />
  )
}
