import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { RapierRigidBody } from '@react-three/rapier'
import { readDieValue } from '../physics/read-die'
import {
  CALM_ANGULAR_SQ,
  CALM_LINEAR_SQ,
  COCKED_CONFIDENCE,
  SETTLE_FRAMES,
} from '../physics/settle'
import { useGameStore } from '../state/game-store'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type SettleWatcherProps = {
  bodies: RefObject<RapierRigidBody[]>
  count: number
}

/**
 * Per-frame settle detection — pure ref work, no React state (the physics/state boundary).
 * Reads the bodies (registered by the dice) and the store phase via getState() inside the
 * frame loop, so it never touches refs or the store during render. Only watches while a roll
 * is in flight; the phase gate also makes it report exactly once (setResult flips phase to
 * 'settled'). A cocked die (confidence < threshold) is nudged up with a random spin, not reported.
 */
export function SettleWatcher({ bodies, count }: SettleWatcherProps) {
  const stableFrames = useRef(0)

  useFrame(() => {
    if (useGameStore.getState().phase !== 'rolling') return

    const dice = bodies.current
    if (dice.length < count || dice.some((b) => b == null)) return

    const calm = dice.every((rb) => {
      const lv = rb.linvel()
      const av = rb.angvel()
      const linSq = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z
      const angSq = av.x * av.x + av.y * av.y + av.z * av.z
      return linSq < CALM_LINEAR_SQ && angSq < CALM_ANGULAR_SQ
    })

    if (!calm) {
      stableFrames.current = 0
      return
    }
    if (++stableFrames.current <= SETTLE_FRAMES) return

    const readings = dice.map((rb) => readDieValue(rb))

    // Cocked die → nudge it up with a random spin and keep watching (never report a lean).
    if (readings.some((r) => r.confidence < COCKED_CONFIDENCE)) {
      dice.forEach((rb, i) => {
        if (readings[i].confidence < COCKED_CONFIDENCE) {
          rb.applyImpulse({ x: 0, y: 2, z: 0 }, true)
          rb.applyTorqueImpulse(
            { x: rand(-0.5, 0.5), y: rand(-0.5, 0.5), z: rand(-0.5, 0.5) },
            true,
          )
        }
      })
      stableFrames.current = 0
      return
    }

    useGameStore.getState().setResult(readings.map((r) => r.value))
    stableFrames.current = 0
  })

  return null
}
