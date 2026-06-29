import type { CSSProperties } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DesktopDashboard } from './dashboard/desktop/DesktopDashboard'
import {
  appendUnit,
  createFallbackPriceDay,
  FALLBACK_PRICE_CURVE,
  FALLBACK_SOLAR_CURVE,
  getEnergyPriceInsight,
  getSolarForecastInsight,
} from '../services/dashboardInsights'
import type { DataStateBadgeModel } from '../models/dataState'
import type { InsightViewMode } from '../models/dashboardInsights'
import { MobileDashboard } from './mobile/MobileDashboard'
import { useBatteryHistory } from '../hooks/useBatteryHistory'
import { useBatteryOptimizer } from '../hooks/useBatteryOptimizer'
import { useEnergyData } from '../hooks/useEnergyData'
import { useEvChargerController } from '../hooks/useEvChargerController'
import { useHistoricalEnergyDay } from '../hooks/useHistoricalEnergyDay'
import { useIsMobileView } from '../hooks/useIsMobileView'
import { useNotificationPreferences } from '../hooks/useNotificationPreferences'
import { useNotifications } from '../hooks/useNotifications'
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
  const batteryHistory = useBatteryHistory(data.batterySocValue)
  const peakRates = usePeakRates()
  const solarForecast = useSolarForecast()
  const todayTotals = useTodayEnergyTotals()
  const notifications = useNotifications()
  const notificationPreferences = useNotificationPreferences()
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

  const solarProductionEnergyKwh = data.solarProductionToday
  const solarPowerCurve = data.solarProductionCurveAvailable
    ? data.solarProductionCurve
    : solarForecast.hourlyPowerKw.some((value) => value > 0)
      ? solarForecast.hourlyPowerKw
      : FALLBACK_SOLAR_CURVE
  const fallbackPriceDay = createFallbackPriceDay(now)
  const priceDays = useMemo(
    () => (peakRates.days.length ? peakRates.days : [fallbackPriceDay]),
    [fallbackPriceDay, peakRates.days],
  )
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
  const toBadge = (tone: 'live' | 'mock' | 'stale'): DataStateBadgeModel => ({
    label: tone === 'live' ? 'Live' : tone === 'mock' ? 'Mock' : 'Stale',
    tone,
  })
  const batteryOptimizerInputs = useMemo(
    () => ({
      batteryPowerKw: data.batteryPowerValue,
      batterySocPercent: data.batterySocValue,
      batteryStatus: data.batteryStatus,
      currentPriceDkkPerKwh: currentPrice === '---' ? null : Number.parseFloat(currentPrice),
      gridPowerKw: data.gridPowerValue,
      peakRateDays: priceDays,
      solarForecastWindows: solarForecast.windows,
    }),
    [
      currentPrice,
      data.batteryPowerValue,
      data.batterySocValue,
      data.batteryStatus,
      data.gridPowerValue,
      priceDays,
      solarForecast.windows,
    ],
  )
  const batteryOptimizer = useBatteryOptimizer(batteryOptimizerInputs)
  const historicalEnergyDay = useHistoricalEnergyDay({
    currentDistribution: {
      battery: data.batteryDistributionToday,
      batteryCharge: data.batteryChargeToday,
      batteryDischarge: data.batteryDischargeToday,
      ev: todayTotals.evKwh,
      gridExport: todayTotals.gridExportKwh,
      gridImport: todayTotals.gridKwh,
      grid: todayTotals.gridKwh,
      home: todayTotals.homeKwh,
      solar: solarProductionEnergyKwh,
    },
    currentSolarProduction: {
      curve: solarPowerCurve,
      labels: Array.from({ length: solarPowerCurve.length }, (_, index) => `${String(index).padStart(2, '0')}:00`),
      value: solarProductionEnergyKwh,
    },
  })
  const pricesDataState = toBadge(peakRates.source === 'mock' ? 'mock' : peakRates.isStale ? 'stale' : 'live')
  const solarForecastDataState = toBadge(solarForecast.isMock ? 'mock' : 'live')
  const energyDistributionDataState = toBadge(historicalEnergyDay.distribution.dataState === 'mock' ? 'mock' : 'live')
  const solarProductionDataState = toBadge(historicalEnergyDay.solarProduction.dataState === 'mock' ? 'mock' : 'live')
  const weatherDataState = toBadge(data.dataState.weather as 'live' | 'mock')
  const overviewDataState = toBadge(data.dataState.overview as 'live' | 'mock')
  const batteryDataState = toBadge(data.dataState.battery as 'live' | 'mock')
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
          capacity: data.batteryCapacity,
          dataState: batteryDataState,
          energy: data.batteryEnergy,
          power: data.batteryPower,
          soc: data.batterySoc,
          socValue: data.batterySocValue,
          status: data.batteryStatus,
        }}
        batteryOptimizer={batteryOptimizer}
        batteryHistory={batteryHistory}
        charger={{
          chargeRate: data.evChargePower,
          sessionDuration: data.evChargeSessionDuration,
          sessionEnergy: data.evChargeSessionEnergy,
          status: data.evChargeStatus,
        }}
        controller={evController}
        displayDate={displayDate}
        displayTime={displayTime}
        energyDayControls={historicalEnergyDay.controls}
        insightControls={insightControls}
        notificationPreferences={notificationPreferences.preferences}
        notifications={notifications}
        onNotificationPreferenceChange={notificationPreferences.setPreference}
        distribution={{ ...historicalEnergyDay.distribution, dataState: energyDistributionDataState }}
        overview={{
          batteryMeta: batteryFlowMeta,
          batteryPower: data.batteryPower,
          dataState: overviewDataState,
          evMeta: data.evChargeStatus,
          evPower: data.evChargePower,
          gridMeta: data.gridStatus,
          gridPower: data.gridPower,
          homePower: data.homePower,
          solarPower: data.solarPower,
        }}
        prices={{ ...energyPriceInsight, dataState: pricesDataState }}
        solarForecast={{ ...solarForecastInsight, dataState: solarForecastDataState }}
        solarProduction={{
          curve: historicalEnergyDay.solarProduction.curve,
          dataState: solarProductionDataState,
          labels: historicalEnergyDay.solarProduction.labels,
          value: historicalEnergyDay.solarProduction.value,
        }}
        weather={{
          condition: data.weatherCondition,
          dataState: weatherDataState,
          temperature: data.weatherTemperature,
        }}
      />
    )
  }

  return (
    <DesktopDashboard
      battery={{
        capacity: data.batteryCapacity,
        dataState: batteryDataState,
        energy: data.batteryEnergy,
        meta: batteryFlowMeta,
        power: data.batteryPower,
        powerValue: data.batteryPowerValue,
        soc: batterySoc,
        socValue: data.batterySocValue,
        status: data.batteryStatus,
      }}
      batteryOptimizer={batteryOptimizer}
      batteryHistory={batteryHistory}
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
      distribution={{ ...historicalEnergyDay.distribution, dataState: energyDistributionDataState }}
      grid={{
        power: data.gridPower,
        powerValue: data.gridPowerValue,
        status: data.gridStatus,
      }}
      homePower={data.homePower}
      energyDayControls={historicalEnergyDay.controls}
      insightControls={insightControls}
      isEvChargerOpen={isEvChargerOpen}
      notificationPreferences={notificationPreferences.preferences}
      notifications={notifications}
      onNotificationPreferenceChange={notificationPreferences.setPreference}
      onCloseEvCharger={closeEvCharger}
      onOpenEvCharger={openEvCharger}
      prices={{ ...energyPriceInsight, dataState: pricesDataState }}
      sceneStyle={sceneStyle}
      shellStyle={shellStyle}
      weather={{
        condition: data.weatherCondition,
        dataState: weatherDataState,
        temperature: data.weatherTemperature,
      }}
      solar={{
        forecast: { ...solarForecastInsight, dataState: solarForecastDataState },
        power: data.solarPower,
        production: { ...historicalEnergyDay.solarProduction, dataState: solarProductionDataState },
      }}
    />
  )
}
