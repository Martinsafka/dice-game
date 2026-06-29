import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { RapierRigidBody } from '@react-three/rapier'
import { readDieValue, type DieReading } from '../physics/read-die'
import {
  CALM_ANGULAR_SQ,
  CALM_LINEAR_SQ,
  COCKED_CONFIDENCE,
  SETTLE_FRAMES,
} from '../physics/settle'

type SettleWatcherProps = {
  dice: RefObject<RapierRigidBody | null>[]
  onSettle: (readings: DieReading[]) => void
}

/**
 * Per-frame settle detection — pure ref work, no React state (the physics/state boundary).
 * When every die stays calm for SETTLE_FRAMES consecutive frames, it reads their values and
 * fires `onSettle` once — unless any die is cocked (confidence < COCKED_CONFIDENCE), in which
 * case it keeps watching (a nudge is a follow-up). Edge-triggered: dice moving again (a new
 * throw) re-arms it. M3 gates this on the store phase and makes `onSettle` the single store write.
 */
export function SettleWatcher({ dice, onSettle }: SettleWatcherProps) {
  const stableFrames = useRef(0)
  const reported = useRef(false)
  const warnedCocked = useRef(false)

  useFrame(() => {
    const calm = dice.every((ref) => {
      const rb = ref.current
      if (!rb) return false
      const lv = rb.linvel()
      const av = rb.angvel()
      const linSq = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z
      const angSq = av.x * av.x + av.y * av.y + av.z * av.z
      return linSq < CALM_LINEAR_SQ && angSq < CALM_ANGULAR_SQ
    })

    // Moving (or a die not yet mounted) → re-arm for the next rest.
    if (!calm) {
      stableFrames.current = 0
      reported.current = false
      warnedCocked.current = false
      return
    }

    if (reported.current) return
    if (++stableFrames.current <= SETTLE_FRAMES) return

    const readings = dice.map((ref) => readDieValue(ref.current!))
    if (readings.some((r) => r.confidence < COCKED_CONFIDENCE)) {
      if (!warnedCocked.current) {
        warnedCocked.current = true
        const conf = readings.map((r) => r.confidence.toFixed(3)).join(', ')
        console.warn(`[settle] cocked die — not reporting (confidence ${conf})`)
      }
      return // keep watching; a nudge/re-roll is a follow-up
    }

    reported.current = true
    onSettle(readings)
  })

  return null
}
