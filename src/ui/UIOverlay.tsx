import { useGameStore } from '../state/game-store'
import { useShakeToRoll } from '../input/useShakeToRoll'
import { requestMotionPermission } from '../input/motion'

type UIOverlayProps = {
  onRoll: () => void
}

// Only show the motion-permission button on touch devices (where shake + tilt are meaningful).
function isCoarsePointer(): boolean {
  return (
    typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false)
  )
}

/**
 * DOM HUD over the canvas (not built from Three meshes). The reactive, low-frequency side: it
 * reads the Zustand store and re-renders once per roll. The overlay is click-through
 * (pointer-events: none) except the controls, so pointer events reach the dice (for dragging).
 * The "Enable tilt & shake" button requests device permission (from the tap) and flips
 * `motionStatus`, which the shake hook and the in-Physics tilt controller react to.
 */
export function UIOverlay({ onRoll }: UIOverlayProps) {
  const phase = useGameStore((s) => s.phase)
  const results = useGameStore((s) => s.results)
  const total = useGameStore((s) => s.total)
  const rolls = useGameStore((s) => s.rolls)
  const motionStatus = useGameStore((s) => s.motionStatus)
  const setMotionStatus = useGameStore((s) => s.setMotionStatus)
  useShakeToRoll(onRoll)

  const rolling = phase === 'rolling'
  const settled = phase === 'settled'
  const coarse = isCoarsePointer()

  function enableMotion() {
    void requestMotionPermission().then(setMotionStatus)
  }

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

        {coarse && motionStatus !== 'enabled' && (
          <button className="ui-shake" onClick={enableMotion}>
            {motionStatus === 'denied'
              ? '📱 Motion blocked'
              : motionStatus === 'unsupported'
                ? '📱 No motion sensor'
                : '📱 Enable tilt & shake'}
          </button>
        )}
        {coarse && motionStatus === 'enabled' && (
          <span className="ui-hint">📱 Tilt to slide · shake to roll</span>
        )}
      </div>
    </div>
  )
}
