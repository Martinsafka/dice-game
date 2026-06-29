import { forwardRef } from 'react'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'

// Distinct colours per face so the tumble is visible. Order matches BoxGeometry's
// material slots (+X, -X, +Y, -Y, +Z, -Z) — the same order the M2 value table uses,
// so swapping these for number CanvasTextures later is a drop-in. See physics.md.
const FACE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

type DieProps = {
  position?: [number, number, number]
}

/**
 * A single dynamic die. M1: a homogeneous-mass cuboid (colliders="cuboid", uniform
 * density → fair) that falls and tumbles. Number faces + readDieValue arrive in M2.
 */
export const Die = forwardRef<RapierRigidBody, DieProps>(function Die(
  { position = [0, 5, 0] },
  ref,
) {
  return (
    <RigidBody
      ref={ref}
      colliders="cuboid"
      position={position}
      restitution={0.3}
      friction={0.8}
      angularVelocity={[6, 4, 8]}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        {FACE_COLORS.map((color, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={color} />
        ))}
      </mesh>
    </RigidBody>
  )
})
