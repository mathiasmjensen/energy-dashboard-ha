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
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(4,8,18,0.82)] px-4 py-6 backdrop-blur-xl"
      onPointerDown={handleBackdropPointerDown}
    >
      <section
        className="flex max-h-[min(92vh,1080px)] w-full max-w-[920px] flex-col gap-5 overflow-y-auto rounded-[28px] border border-white/10 bg-[#0d131d]/96 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ev-modal-title"
      >
        <header className="flex items-center justify-between gap-4">
          <h2 id="ev-modal-title" className="text-[1.55rem] font-semibold tracking-tight text-dashboard-text">EV Charger</h2>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-dashboard-soft transition hover:border-white/20 hover:bg-white/8 hover:text-dashboard-text"
            type="button"
            aria-label="Close EV charger details"
            onClick={onClose}
          >
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
