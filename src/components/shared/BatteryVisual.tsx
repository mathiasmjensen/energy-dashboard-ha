import { cn } from '../../lib/cn'

export function BatteryVisual({
  className,
  level,
  size = 'default',
}: {
  className?: string
  level: number
  size?: 'default' | 'modal'
}) {
  const clampedLevel = Math.max(0, Math.min(100, Number.isFinite(level) ? level : 0))

  return (
    <div
      className={cn(
        'relative isolate mx-auto rounded-[10px] border-[4px] border-[rgba(226,237,229,0.78)] shadow-[inset_0_0_0_3px_rgba(0,0,0,0.42),0_0_18px_rgba(51,214,107,0.18)]',
        size === 'modal'
          ? 'h-[170px] w-[98px] rounded-[18px] border-[6px] shadow-[inset_0_0_0_4px_rgba(0,0,0,0.42),0_0_32px_rgba(51,214,107,0.2)]'
          : 'h-[102px] w-[60px]',
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute left-1/2 top-[-10px] -translate-x-1/2 rounded-t-[5px] border-[3px] border-[rgba(226,237,229,0.78)] border-b-0',
          size === 'modal' ? 'top-[-12px] h-[10px] w-[28px] border-[4px]' : 'h-[7px] w-[18px]',
        )}
      />
      <div
        className={cn(
          'absolute bottom-[7px] left-[7px] right-[7px] rounded-[4px] bg-[linear-gradient(180deg,#46ef78,#1faa4c)]',
          size === 'modal'
            ? 'bottom-[11px] left-[11px] right-[11px] max-h-[calc(100%-22px)] rounded-[8px] shadow-[0_0_24px_rgba(70,239,120,0.28)]'
            : 'max-h-[calc(100%-14px)]',
        )}
        style={{ height: `${clampedLevel}%` }}
      />
    </div>
  )
}
