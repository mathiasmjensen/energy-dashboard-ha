import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 900

function getMatches() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth <= MOBILE_BREAKPOINT
}

export function useIsMobileView() {
  const [isMobileView, setIsMobileView] = useState(getMatches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const sync = () => setIsMobileView(mediaQuery.matches)

    sync()
    mediaQuery.addEventListener('change', sync)

    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  return isMobileView
}
