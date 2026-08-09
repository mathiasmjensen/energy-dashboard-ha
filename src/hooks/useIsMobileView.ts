import { useEffect, useState } from 'react'

// Tablets use the desktop workspace, scaled as one dashboard canvas. Keep the
// mobile information architecture for phone-sized displays only.
const MOBILE_BREAKPOINT = 767

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
