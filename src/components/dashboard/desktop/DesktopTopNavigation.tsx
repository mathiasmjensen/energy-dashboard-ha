import { cn } from '../../../lib/cn'
import { OverviewIcon } from './DesktopShared'
import type { IconName } from './DesktopShared'

export type DesktopPageKey = 'battery' | 'ev' | 'notifications' | 'overview' | 'settings'

const MENU_ITEMS: Array<{ icon: IconName; key: DesktopPageKey; label: string }> = [
  { icon: 'home', key: 'overview', label: 'Overview' },
  { icon: 'solar', key: 'overview', label: 'Solar' },
  { icon: 'battery', key: 'battery', label: 'Battery' },
  { icon: 'car', key: 'ev', label: 'EV Charger' },
  { icon: 'bell', key: 'notifications', label: 'Notifications' },
  { icon: 'settings', key: 'settings', label: 'Settings' },
]

export function DesktopTopNavigation({
  active,
  onSelect,
}: {
  active: DesktopPageKey
  onSelect: (page: DesktopPageKey) => void
}) {
  return (
    <nav className="absolute left-1/2 top-0 flex h-[58px] -translate-x-1/2 items-center rounded-[18px] border border-white/10 bg-[#090e16]/88 p-1 shadow-[0_16px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl" aria-label="Dashboard sections">
      {MENU_ITEMS.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-full min-w-[92px] flex-col items-center justify-center gap-0.5 rounded-[13px] px-3 text-[11px] font-semibold transition',
              isActive ? 'bg-dashboard-green/15 text-dashboard-green shadow-[inset_0_0_0_1px_rgba(96,234,93,0.35)]' : 'text-dashboard-soft hover:bg-white/[0.06] hover:text-white',
            )}
            type="button"
            onClick={() => onSelect(item.key)}
          >
            <OverviewIcon name={item.icon} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
