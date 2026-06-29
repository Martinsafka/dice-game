import { useGameStore } from '../state/game-store'

type UIOverlayProps = {
  onRoll: () => void
}

/**
 * DOM HUD over the canvas (not built from Three meshes). The reactive, low-frequency side:
 * it reads the Zustand store and re-renders once per roll. The overlay is click-through
 * (pointer-events: none) except the button, so clicking the tray still rolls.
 */
export function UIOverlay({ onRoll }: UIOverlayProps) {
  const phase = useGameStore((s) => s.phase)
  const results = useGameStore((s) => s.results)
  const total = useGameStore((s) => s.total)
  const rolls = useGameStore((s) => s.rolls)

  const rolling = phase === 'rolling'
  const settled = phase === 'settled'

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

      <button className="ui-roll" onClick={onRoll} disabled={rolling}>
        {rolls === 0 ? 'Roll' : 'Roll again'}
      </button>
    </div>
  )
}
