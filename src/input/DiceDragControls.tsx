import { useEffect, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Plane, Quaternion, Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import { useGameStore } from '../state/game-store'

// Drag-all feel — tune to taste.
const DRAG_HEIGHT = 2.5 // dice are pulled up toward this y → they read as lifted into the air
const PULL = 0.4 // spring strength toward the cursor (per-frame impulse)
const DAMP = 0.15 // velocity damping inside the spring
const MAX_IMPULSE = 3 // clamp so a fast cursor can't explode the sim
const CORNER = new Vector3(0.5, 0.5, 0.5) // local corner each die hangs from

const _plane = new Plane(new Vector3(0, 1, 0), -DRAG_HEIGHT)
const _target = new Vector3()
const _q = new Quaternion()
const _corner = new Vector3()

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type DiceDragControlsProps = {
  bodies: RefObject<RapierRigidBody[]>
  dragging: RefObject<boolean>
}

/**
 * Drag-all controller. While dragging (set in DiceGame on canvas pointer-down), every die is
 * pulled toward the cursor by a spring impulse applied at ONE corner (applyImpulseAtPoint), so
 * each die hangs and swings from that corner under gravity — full physics, they still collide.
 * Release (window pointerup) clears the drag damping, adds a spin, and starts a roll so
 * SettleWatcher reads the result. Pure ref / imperative work (the physics/state boundary).
 */
export function DiceDragControls({ bodies, dragging }: DiceDragControlsProps) {
  const camera = useThree((s) => s.camera)
  const raycaster = useThree((s) => s.raycaster)
  const pointer = useThree((s) => s.pointer)

  useEffect(() => {
    function onPointerUp() {
      if (!dragging.current) return
      dragging.current = false
      for (const rb of bodies.current) {
        if (!rb) continue
        rb.setLinearDamping(0)
        rb.setAngularDamping(0)
        rb.setAngvel({ x: rand(-10, 10), y: rand(-10, 10), z: rand(-10, 10) }, true)
      }
      useGameStore.getState().startRoll()
    }
    window.addEventListener('pointerup', onPointerUp)
    return () => window.removeEventListener('pointerup', onPointerUp)
  }, [bodies, dragging])

  useFrame(() => {
    if (!dragging.current) return
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(_plane, _target)) return

    for (const rb of bodies.current) {
      if (!rb) continue

      // world position of the die's hang corner
      const t = rb.translation()
      const r = rb.rotation()
      _q.set(r.x, r.y, r.z, r.w)
      _corner.copy(CORNER).applyQuaternion(_q)
      _corner.x += t.x
      _corner.y += t.y
      _corner.z += t.z

      // damped spring from the corner toward the cursor target
      const v = rb.linvel()
      let ix = (_target.x - _corner.x) * PULL - v.x * DAMP
      let iy = (_target.y - _corner.y) * PULL - v.y * DAMP
      let iz = (_target.z - _corner.z) * PULL - v.z * DAMP

      const mag = Math.hypot(ix, iy, iz)
      if (mag > MAX_IMPULSE) {
        const k = MAX_IMPULSE / mag
        ix *= k
        iy *= k
        iz *= k
      }

      rb.applyImpulseAtPoint(
        { x: ix, y: iy, z: iz },
        { x: _corner.x, y: _corner.y, z: _corner.z },
        true,
      )
    }
  })

  return null
}
