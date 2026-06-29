import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, type RapierRigidBody } from '@react-three/rapier'
import { Lights } from './scene/Lights'
import { Tray } from './scene/Tray'
import { Die } from './scene/Die'

// Toggle to render the (invisible) tray-wall colliders as wireframes while tuning.
const SHOW_COLLIDERS = false

const rand = (min: number, max: number) => min + Math.random() * (max - min)

// TEMP M1 dev throw — re-drops the die with a random tumble to stress-test the walls.
// The real per-die rollDice() helper (src/physics/) + input land in M3 / M4.
function throwDie(rb: RapierRigidBody) {
  rb.setTranslation({ x: rand(-1, 1), y: 4, z: rand(-1, 1) }, true)
  rb.setLinvel({ x: rand(-2, 2), y: rand(2, 4), z: rand(-2, 2) }, true)
  rb.setAngvel({ x: rand(-15, 15), y: rand(-15, 15), z: rand(-15, 15) }, true)
}

/**
 * Root composition. M1: a physical tray (floor + 4 walls) with one dynamic die that
 * falls, bounces, and settles. Click the scene to re-throw it. Settle detection +
 * reading the value are M2; the DOM UI overlay is M3. See agent_docs/roadmap.md.
 */
export function DiceGame() {
  const dieRef = useRef<RapierRigidBody>(null)

  return (
    <Canvas
      orthographic
      shadows
      camera={{ position: [0, 10, 0], zoom: 70, near: 0.1, far: 100 }}
      // Straight-down top-down view. Setting the rotation directly avoids the gimbal
      // degeneracy of lookAt() when the view direction is parallel to the camera's `up`.
      onCreated={({ camera }) => {
        camera.rotation.set(-Math.PI / 2, 0, 0)
      }}
      onPointerDown={() => {
        if (dieRef.current) throwDie(dieRef.current)
      }}
    >
      <color attach="background" args={['#0f172a']} />
      <Lights />
      <Physics gravity={[0, -9.81, 0]} debug={SHOW_COLLIDERS}>
        <Tray />
        <Die ref={dieRef} />
      </Physics>
    </Canvas>
  )
}
