import { Canvas } from '@react-three/fiber'
import { Lights } from './scene/Lights'
import { Ground } from './scene/Ground'
import { StaticBox } from './scene/StaticBox'

/**
 * Root composition. M0: a top-down orthographic scene rendering one static box on a
 * ground plane — proves R3F + the ortho camera are wired. Physics (the tray + dynamic
 * dice) lands in M1; the DOM UI overlay in M3. See agent_docs/roadmap.md.
 */
export function DiceGame() {
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
    >
      <color attach="background" args={['#0f172a']} />
      <Lights />
      <Ground />
      <StaticBox />
    </Canvas>
  )
}
