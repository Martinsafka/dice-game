import { useEffect } from 'react'
import { useRapier } from '@react-three/rapier'
import { useGameStore } from '../state/game-store'

const G = 9.81
const MAX_TILT_DEG = 40 // tilt past this from neutral = full horizontal force
const TILT_GRAVITY = 22 // horizontal gravity at full tilt (small tilt → slide, large → fly to a wall)
const SIGN_X = 1 // flip if the dice slide the wrong way left/right
const SIGN_Z = 1 // flip if the dice slide the wrong way front/back

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/**
 * Mobile tilt → physics. Once motion is enabled, maps device orientation (beta/gamma) to the
 * Rapier world's horizontal gravity, so tilting the phone slides the dice — gently for a small
 * tilt, hard wall-to-wall for a big one. The pose at enable time is the neutral baseline
 * (calibrated on the first event), so it works however the phone is held. Must live inside
 * <Physics> (useRapier); sets world.gravity imperatively — never through React state.
 */
export function TiltGravity() {
  const motionStatus = useGameStore((s) => s.motionStatus)
  const { world } = useRapier()

  useEffect(() => {
    if (motionStatus !== 'enabled') return
    let base: { beta: number; gamma: number } | null = null

    function handler(event: DeviceOrientationEvent) {
      const beta = event.beta ?? 0 // front-back tilt
      const gamma = event.gamma ?? 0 // left-right tilt
      if (!base) base = { beta, gamma } // neutral = however the phone is held right now
      const nx = clamp((gamma - base.gamma) / MAX_TILT_DEG, -1, 1)
      const nz = clamp((beta - base.beta) / MAX_TILT_DEG, -1, 1)
      world.gravity.x = SIGN_X * nx * TILT_GRAVITY
      world.gravity.z = SIGN_Z * nz * TILT_GRAVITY
      world.gravity.y = -G
    }

    window.addEventListener('deviceorientation', handler)
    return () => {
      window.removeEventListener('deviceorientation', handler)
      world.gravity.x = 0
      world.gravity.z = 0
      world.gravity.y = -G
    }
  }, [motionStatus, world])

  return null
}
