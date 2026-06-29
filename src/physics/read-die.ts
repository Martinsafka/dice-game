import { Quaternion, Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import { FACES } from './faces'

export type DieReading = { value: number; confidence: number }

const UP = new Vector3(0, 1, 0)

// Preallocated — don't garbage a Quaternion/Vector3 on every read (this runs per frame).
const _q = new Quaternion()
const _n = new Vector3()

/**
 * Read a die's value from its world rotation: rotate each face normal into world space and
 * pick the one pointing most "up" (largest dot with UP). `confidence` ≈ 1 → a face lies flat
 * on top; < ~0.95 → the die is cocked (leaning) and the value is ambiguous.
 */
export function readDieValue(rb: RapierRigidBody): DieReading {
  const r = rb.rotation()
  _q.set(r.x, r.y, r.z, r.w)

  let best = -Infinity
  let value = 0
  for (const face of FACES) {
    const d = _n.copy(face.normal).applyQuaternion(_q).dot(UP)
    if (d > best) {
      best = d
      value = face.value
    }
  }
  return { value, confidence: best }
}
