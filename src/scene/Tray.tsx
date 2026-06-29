import { CuboidCollider, RigidBody } from '@react-three/rapier'

/**
 * The play area: a felt-green floor + 4 invisible walls, all fixed bodies. Walls are
 * collider-only (no mesh) and tall enough that a hard throw can't pop a die out.
 * Flip <Physics debug> in DiceGame to see the colliders. See agent_docs/physics.md.
 */
export function Tray({ size = 6, wallHeight = 4, thickness = 0.5 }) {
  const h = size / 2

  return (
    <group>
      {/* floor — visible felt plane + a thin collider slab just beneath y=0 */}
      <RigidBody type="fixed" friction={0.9} restitution={0.2}>
        <mesh receiveShadow rotation-x={-Math.PI / 2}>
          <planeGeometry args={[size, size]} />
          <meshStandardMaterial color="#15803d" roughness={0.95} />
        </mesh>
        <CuboidCollider args={[h, thickness / 2, h]} position={[0, -thickness / 2, 0]} />
      </RigidBody>

      {/* 4 walls — collider-only, around the edge */}
      <RigidBody type="fixed" friction={0.4} restitution={0.4}>
        <CuboidCollider
          args={[h, wallHeight / 2, thickness / 2]}
          position={[0, wallHeight / 2, -h]}
        />
        <CuboidCollider
          args={[h, wallHeight / 2, thickness / 2]}
          position={[0, wallHeight / 2, h]}
        />
        <CuboidCollider
          args={[thickness / 2, wallHeight / 2, h]}
          position={[-h, wallHeight / 2, 0]}
        />
        <CuboidCollider
          args={[thickness / 2, wallHeight / 2, h]}
          position={[h, wallHeight / 2, 0]}
        />
      </RigidBody>
    </group>
  )
}
