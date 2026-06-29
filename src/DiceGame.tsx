import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, type RapierRigidBody } from '@react-three/rapier'
import { Lights } from './scene/Lights'
import { Tray } from './scene/Tray'
import { Die } from './scene/Die'
import { SettleWatcher } from './scene/SettleWatcher'
import { DiceDragControls } from './input/DiceDragControls'
import { UIOverlay } from './ui/UIOverlay'
import { rollDice } from './physics/roll'
import { useGameStore } from './state/game-store'

// Toggle to render the (invisible) tray-wall colliders as wireframes while tuning.
const SHOW_COLLIDERS = false

const DIE_SPAWN: [number, number, number][] = [
  [-1.2, 5, 0],
  [1.2, 5, 0],
]

// Extra damping while dragging so the dangling dice swing gently instead of thrashing.
const DRAG_LINEAR_DAMPING = 1.5
const DRAG_ANGULAR_DAMPING = 2

/**
 * Root composition. M4: two dice in a tray, a Zustand store, a DOM overlay, and a drag-all
 * throw. The Roll button throws both dice; pressing the tray grabs ALL dice toward the cursor
 * (they dangle from a corner — DiceDragControls) and releasing throws them. DiceGame doesn't
 * subscribe to the store (actions via getState), so it never re-renders.
 */
export function DiceGame() {
  const bodies = useRef<RapierRigidBody[]>([])
  const dragging = useRef(false)

  function ready() {
    const dice = bodies.current
    return dice.length >= DIE_SPAWN.length && dice.every((b) => b != null)
  }

  function handleRoll() {
    if (!ready()) return
    useGameStore.getState().startRoll()
    rollDice(bodies.current)
  }

  // Press anywhere on the tray → grab ALL dice: they fly to the cursor and dangle from a corner
  // (DiceDragControls drives them). Release (window pointerup, in the controller) throws them.
  function startDrag() {
    if (!ready()) return
    dragging.current = true
    for (const rb of bodies.current) {
      rb.setLinearDamping(DRAG_LINEAR_DAMPING)
      rb.setAngularDamping(DRAG_ANGULAR_DAMPING)
    }
  }

  return (
    <div className="game">
      <UIOverlay onRoll={handleRoll} />
      <Canvas
        orthographic
        shadows
        camera={{ position: [0, 10, 0], zoom: 70, near: 0.1, far: 100 }}
        // Straight-down top-down view. Setting the rotation directly avoids the gimbal
        // degeneracy of lookAt() when the view direction is parallel to the camera's `up`.
        onCreated={({ camera }) => {
          camera.rotation.set(-Math.PI / 2, 0, 0)
        }}
        onPointerDown={startDrag}
      >
        <color attach="background" args={['#0f172a']} />
        <Lights />
        <Physics gravity={[0, -9.81, 0]} debug={SHOW_COLLIDERS}>
          <Tray />
          {DIE_SPAWN.map((spawn, i) => (
            <Die
              key={i}
              ref={(body) => {
                if (body) bodies.current[i] = body
              }}
              position={spawn}
              dragging={dragging}
            />
          ))}
          <SettleWatcher bodies={bodies} count={DIE_SPAWN.length} />
          <DiceDragControls bodies={bodies} dragging={dragging} />
        </Physics>
      </Canvas>
    </div>
  )
}
