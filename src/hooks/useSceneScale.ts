import { useEffect, useState } from 'react'

const DESIGN_WIDTH = 1672
const DESIGN_HEIGHT = 941

export function useSceneScale() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      setScale(
        Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT),
      )
    }

    updateScale()
    window.addEventListener('resize', updateScale, { passive: true })
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return scale
}
