import { forwardRef, useMemo } from 'react'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { getNumberMaterials } from '../textures/number-materials'

type DieProps = {
  position?: [number, number, number]
}

/**
 * A single dynamic die: a homogeneous-mass cuboid (colliders="cuboid", uniform density →
 * fair). Faces show numbers 1–6 via shared CanvasTexture materials whose digits come from the
 * FACES table, so the rendered up-face always matches readDieValue. Thrown by rollDice
 * (src/physics/roll.ts); value read from its rest rotation (src/physics/read-die.ts).
 */
export const Die = forwardRef<RapierRigidBody, DieProps>(function Die(
  { position = [0, 5, 0] },
  ref,
) {
  const materials = useMemo(() => getNumberMaterials(), [])

  return (
    <RigidBody ref={ref} colliders="cuboid" position={position} restitution={0.3} friction={0.8}>
      <mesh castShadow material={materials}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </RigidBody>
  )
})
