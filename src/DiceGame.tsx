import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, type RapierRigidBody } from '@react-three/rapier'
import { Lights } from './scene/Lights'
import { Tray } from './scene/Tray'
import { Die } from './scene/Die'
import { SettleWatcher } from './scene/SettleWatcher'
import { UIOverlay } from './ui/UIOverlay'
import { rollDice } from './physics/roll'
import { useGameStore } from './state/game-store'

// Toggle to render the (invisible) tray-wall colliders as wireframes while tuning.
const SHOW_COLLIDERS = false

const DIE_SPAWN: [number, number, number][] = [
  [-1.2, 5, 0],
  [1.2, 5, 0],
]

/**
 * Root composition. M3: two dice, a Zustand store, and a DOM overlay. Click Roll (or the
 * tray) → startRoll + rollDice; SettleWatcher writes the result once the dice rest. The dice
 * register their bodies into one ref (read only outside render); DiceGame doesn't subscribe
 * to the store (actions via getState), so it never re-renders. See agent_docs/roadmap.md.
 */
export function DiceGame() {
  const bodies = useRef<RapierRigidBody[]>([])

  function handleRoll() {
    const dice = bodies.current
    if (dice.length < DIE_SPAWN.length || dice.some((b) => b == null)) return // not mounted yet
    useGameStore.getState().startRoll()
    rollDice(dice)
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
        onPointerDown={handleRoll}
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
            />
          ))}
          <SettleWatcher bodies={bodies} count={DIE_SPAWN.length} />
        </Physics>
      </Canvas>
    </div>
  )
}
