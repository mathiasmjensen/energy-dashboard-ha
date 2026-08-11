import { useEffect, useState } from 'react'

const DESIGN_WIDTH = 1672
const DESIGN_HEIGHT = 941

export type SceneScale = {
  height: number
  width: number
}

export function useSceneScale() {
  const [scale, setScale] = useState<SceneScale>({ height: 1, width: 1 })

  useEffect(() => {
    const updateScale = () => {
      // The desktop dashboard is a complete workspace, not a centered poster.
      // Scale each axis so it always fills the available desktop/tablet viewport.
      setScale({
        height: window.innerHeight / DESIGN_HEIGHT,
        width: window.innerWidth / DESIGN_WIDTH,
      })
    }

    updateScale()
    window.addEventListener('resize', updateScale, { passive: true })
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return scale
}
