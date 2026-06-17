import { useCallback, useEffect } from 'react'
import type { PointerEvent } from 'react'
import type { EvChargerController } from '../hooks/useEvChargerController'
import { EvChargerContent, EvUiIcon } from './ev/EvChargerContent'

type EvChargerModalProps = {
  chargeRate: string
  controller: EvChargerController
  onClose: () => void
  sessionDuration: string
  sessionEnergy: string
  status: string
}

export function EvChargerModal({
  chargeRate,
  controller,
  onClose,
  sessionDuration,
  sessionEnergy,
  status,
}: EvChargerModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <div className="ev-modal-overlay" onPointerDown={handleBackdropPointerDown}>
      <section className="ev-modal" role="dialog" aria-modal="true" aria-labelledby="ev-modal-title">
        <header className="ev-modal__header">
          <h2 id="ev-modal-title">EV Charger</h2>
          <button className="ev-modal__close" type="button" aria-label="Close EV charger details" onClick={onClose}>
            <EvUiIcon name="close" />
          </button>
        </header>

        <EvChargerContent
          chargeRate={chargeRate}
          controller={controller}
          sessionDuration={sessionDuration}
          sessionEnergy={sessionEnergy}
          status={status}
        />
      </section>
    </div>
  )
}
