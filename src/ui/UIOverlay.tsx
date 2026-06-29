import { useGameStore } from '../state/game-store'
import { useShakeToRoll } from '../input/useShakeToRoll'

type UIOverlayProps = {
  onRoll: () => void
}

// Only show the motion-permission button on touch devices (where DeviceMotion is meaningful).
function isCoarsePointer(): boolean {
  return (
    typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false)
  )
}

/**
 * DOM HUD over the canvas (not built from Three meshes). The reactive, low-frequency side: it
 * reads the Zustand store and re-renders once per roll. The overlay is click-through
 * (pointer-events: none) except the controls, so pointer events reach the dice (for dragging).
 */
export function UIOverlay({ onRoll }: UIOverlayProps) {
  const phase = useGameStore((s) => s.phase)
  const results = useGameStore((s) => s.results)
  const total = useGameStore((s) => s.total)
  const rolls = useGameStore((s) => s.rolls)
  const shake = useShakeToRoll(onRoll)

  const rolling = phase === 'rolling'
  const settled = phase === 'settled'
  const coarse = isCoarsePointer()

  return (
    <div className="ui-overlay">
      <div className="ui-panel">
        <div className="ui-dice">
          {settled && results.length > 0 ? (
            results.map((value, i) => (
              <span key={i} className="ui-die">
                {value}
              </span>
            ))
          ) : (
            <>
              <span className="ui-die ui-die--empty">–</span>
              <span className="ui-die ui-die--empty">–</span>
            </>
          )}
        </div>
        <div className="ui-total">
          {settled ? `Total ${total}` : rolling ? 'Rolling…' : 'Ready'}
        </div>
        <div className="ui-rolls">Rolls: {rolls}</div>
      </div>

      <div className="ui-actions">
        <button className="ui-roll" onClick={onRoll} disabled={rolling}>
          {rolls === 0 ? 'Roll' : 'Roll again'}
        </button>

        {coarse && shake.status !== 'enabled' && (
          <button
            className="ui-shake"
            onClick={() => {
              void shake.enable()
            }}
          >
            {shake.status === 'denied'
              ? '📱 Motion blocked'
              : shake.status === 'unsupported'
                ? '📱 No motion sensor'
                : '📱 Shake to roll'}
          </button>
        )}
        {coarse && shake.status === 'enabled' && <span className="ui-hint">📱 Shake to roll</span>}
      </div>
    </div>
  )
}
