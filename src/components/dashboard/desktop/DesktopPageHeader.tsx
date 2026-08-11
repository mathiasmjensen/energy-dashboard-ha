import { DesktopTopNavigation } from './DesktopTopNavigation'
import { StatusPill } from './DesktopShared'
import type { DesktopPageKey } from './DesktopTopNavigation'

export function DesktopPageHeader({
  active,
  displayDate,
  displayTime,
  onSelect,
  subtitle,
  title,
  weather,
}: {
  active: DesktopPageKey
  displayDate: string
  displayTime: string
  onSelect: (page: DesktopPageKey) => void
  subtitle: string
  title: string
  weather: { condition: string; temperature: string }
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 h-[94px] px-7 pt-6">
      <div className="relative h-[70px]">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">{title}</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">{subtitle}</p>
        </div>
        <DesktopTopNavigation active={active} onSelect={onSelect} />
        <div className="absolute right-0 top-0 grid grid-cols-[120px_138px_138px] gap-5">
          <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
          <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
          <StatusPill primary="All systems" secondary="Normal" tone="ok" />
        </div>
      </div>
    </header>
  )
}
