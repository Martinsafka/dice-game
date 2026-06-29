import { useEffect } from 'react'
import { useGameStore } from '../state/game-store'

const SHAKE_THRESHOLD = 22 // |acceleration incl. gravity| (rest ≈ 9.81); tune on a real device
const SHAKE_DEBOUNCE_MS = 700 // one shake = one roll

/**
 * Mobile "shake to roll". Attaches a devicemotion listener once motion is enabled in the store
 * (permission is requested from the tap that sets `motionStatus` — see requestMotionPermission).
 * A shake above the threshold (debounced) fires onRoll. HTTPS is required for DeviceMotion.
 */
export function useShakeToRoll(onRoll: () => void) {
  const motionStatus = useGameStore((s) => s.motionStatus)

  useEffect(() => {
    if (motionStatus !== 'enabled') return
    let lastShake = 0
    function handler(event: DeviceMotionEvent) {
      const a = event.accelerationIncludingGravity
      if (!a) return
      const magnitude = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0)
      if (magnitude < SHAKE_THRESHOLD) return
      const now = performance.now()
      if (now - lastShake < SHAKE_DEBOUNCE_MS) return
      lastShake = now
      onRoll()
    }
    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [motionStatus, onRoll])
}
