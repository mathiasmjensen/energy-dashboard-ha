import type { BatteryPeriod, MobileTab, SolarPeriod } from './MobileTypes'

export type MobileIconName =
  | 'battery'
  | 'bell'
  | 'car'
  | 'chevronDown'
  | 'grid'
  | 'home'
  | 'menu'
  | 'refresh'
  | 'solar'
  | 'sun'

export const MOBILE_TABS: Array<{ icon: MobileIconName; key: MobileTab; label: string; title: string }> = [
  { icon: 'home', key: 'home', label: 'Home', title: 'Home' },
  { icon: 'solar', key: 'solar', label: 'Solar', title: 'Solar' },
  { icon: 'battery', key: 'battery', label: 'Battery', title: 'Battery' },
  { icon: 'car', key: 'ev', label: 'EV', title: 'EV Charger' },
]

export const SOLAR_PERIODS: SolarPeriod[] = ['Day', 'Week', 'Month', 'Year']
export const BATTERY_PERIODS: BatteryPeriod[] = ['Day', 'Week', 'Month']
