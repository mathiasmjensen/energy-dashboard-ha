export type EnergyIconName =
  | 'solar'
  | 'home'
  | 'grid'
  | 'ev'
  | 'battery'
  | 'leaf'
  | 'rate'
  | 'selfPowered'
  | 'status'
  | 'bolt'

type EnergyIconProps = {
  name: EnergyIconName
  className?: string
}

export function EnergyIcon({ name, className }: EnergyIconProps) {
  const iconClassName = ['energy-icon', className].filter(Boolean).join(' ')

  return (
    <svg className={iconClassName} viewBox="0 0 64 64" aria-hidden="true">
      {renderIcon(name)}
    </svg>
  )
}

function renderIcon(name: EnergyIconName) {
  switch (name) {
    case 'solar':
      return (
        <>
          <circle cx="32" cy="13" r="5" fill="none" />
          <path d="M32 2v6M32 18v6M17 13h7M40 13h7M21.5 2.5l4.3 4.3M38.2 19.2l4.3 4.3M42.5 2.5l-4.3 4.3M25.8 19.2l-4.3 4.3" />
          <path d="M20 29h24l8 22H12l8-22Z" fill="none" />
          <path d="M24 29 20 51M32 29v22M40 29l4 22M16 39h32M14 46h36" />
          <path d="M32 51v8M23 59h18" />
        </>
      )
    case 'home':
      return (
        <>
          <path d="M9 30 32 10l23 20" fill="none" />
          <path d="M15 28v27h34V28" fill="none" />
          <path d="M26 55V38h12v17" fill="none" />
        </>
      )
    case 'grid':
      return (
        <>
          <path d="M32 6 18 58M32 6l14 52M17 58h30M22 40h20M25 28h14M28 16h8" fill="none" />
          <path d="M14 20h36L32 6 14 20ZM12 32l40-8M52 32l-40-8" fill="none" />
        </>
      )
    case 'ev':
      return (
        <>
          <path d="M14 35h36l-4-12H22l-8 12Z" fill="none" />
          <path d="M11 35v12h8M45 47h8V35M22 47h21" fill="none" />
          <circle cx="22" cy="48" r="5" fill="none" />
          <circle cx="44" cy="48" r="5" fill="none" />
          <path d="M22 23c2-6 5-9 11-9h8" fill="none" />
        </>
      )
    case 'battery':
      return (
        <>
          <path d="M24 7h16v7h7v43H17V14h7V7Z" fill="none" />
          <path d="M27 7h10M24 24h16M32 22v14M27 31h10" />
          <path d="M24 43h16" />
        </>
      )
    case 'leaf':
      return (
        <>
          <path d="M52 10C31 10 16 22 14 42c16 2 32-8 38-32Z" fill="none" />
          <path d="M12 54c10-18 22-27 38-41" fill="none" />
        </>
      )
    case 'rate':
      return (
        <>
          <circle cx="32" cy="32" r="22" fill="none" />
          <circle cx="32" cy="25" r="7" fill="none" />
          <path d="M18 46c3-8 8-12 14-12s11 4 14 12" fill="none" />
        </>
      )
    case 'selfPowered':
      return (
        <>
          <circle cx="32" cy="32" r="21" fill="none" />
          <path d="M32 13v9M32 42v9M13 32h9M42 32h9" />
          <path d="m22 22 6 6M42 22l-6 6M22 42l6-6M42 42l-6-6" />
        </>
      )
    case 'status':
      return (
        <>
          <path d="M32 8v48M17 56h30M14 37h36M18 23h28" />
          <path d="M32 8 19 56M32 8l13 48" fill="none" />
        </>
      )
    case 'bolt':
      return <path d="M37 5 17 36h15l-5 23 20-34H32l5-20Z" fill="currentColor" stroke="none" />
  }
}
