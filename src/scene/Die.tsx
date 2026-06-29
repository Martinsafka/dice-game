import { forwardRef, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import type { Mesh } from 'three'
import { getNumberMaterials } from '../textures/number-materials'

const DRAG_SCALE = 0.8 // shrink while held to fake "lifted into the air" (ortho cam has no perspective)

type DieProps = {
  position?: [number, number, number]
  dragging: RefObject<boolean>
}

/**
 * A single dynamic die: a homogeneous-mass cuboid (colliders="cuboid", uniform density → fair;
 * ccd on to resist tunnelling). Toon face materials (numbers 1–6 from the FACES table, so the
 * up-face matches readDieValue) + a drei outline for the cel look. While dragging it shrinks a
 * touch (visual mesh only — the collider stays full size); drag-throw physics live in DiceDragControls.
 */
export const Die = forwardRef<RapierRigidBody, DieProps>(function Die(
  { position = [0, 5, 0], dragging },
  ref,
) {
  const materials = useMemo(() => getNumberMaterials(), [])
  const meshRef = useRef<Mesh>(null)

  useFrame((_, dt) => {
    const mesh = meshRef.current
    if (!mesh) return
    const target = dragging.current ? DRAG_SCALE : 1
    const next = mesh.scale.x + (target - mesh.scale.x) * Math.min(1, dt * 10)
    mesh.scale.setScalar(next)
  })

  return (
    <RigidBody
      ref={ref}
      colliders="cuboid"
      position={position}
      restitution={0.3}
      friction={0.8}
      ccd
    >
      <mesh ref={meshRef} castShadow material={materials}>
        <boxGeometry args={[1, 1, 1]} />
        <Outlines thickness={0.04} color="#0f172a" />
      </mesh>
    </RigidBody>
  )
})
