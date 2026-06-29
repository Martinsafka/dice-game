import { useEffect, useRef, useState } from 'react'

const SHAKE_THRESHOLD = 22 // |acceleration incl. gravity| (rest ≈ 9.81); tune on a real device
const SHAKE_DEBOUNCE_MS = 700 // one shake = one roll

export type ShakeStatus = 'idle' | 'enabled' | 'denied' | 'unsupported'

// iOS 13+ adds requestPermission() to DeviceMotionEvent; it isn't in the DOM lib types.
type MotionPermissionApi = {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

/**
 * Mobile "shake to roll". `enable()` MUST be called from a user gesture (a tap) — iOS 13+ only
 * grants motion access then, and HTTPS is required for DeviceMotion at all (hence GitHub Pages).
 * Once enabled, a shake above the threshold (debounced) fires `onShake`. The listener is added
 * imperatively (outside render) and cleaned up on unmount.
 */
export function useShakeToRoll(onShake: () => void) {
  const [status, setStatus] = useState<ShakeStatus>('idle')
  const lastShake = useRef(0)
  const handlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null)

  useEffect(() => {
    return () => {
      if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current)
    }
  }, [])

  async function enable() {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setStatus('unsupported')
      return
    }
    const motion = window.DeviceMotionEvent as unknown as MotionPermissionApi
    if (typeof motion.requestPermission === 'function') {
      try {
        const result = await motion.requestPermission()
        if (result !== 'granted') {
          setStatus('denied')
          return
        }
      } catch {
        setStatus('denied')
        return
      }
    }

    if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current)
    const handler = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity
      if (!a) return
      const magnitude = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0)
      if (magnitude < SHAKE_THRESHOLD) return
      const now = performance.now()
      if (now - lastShake.current < SHAKE_DEBOUNCE_MS) return
      lastShake.current = now
      onShake()
    }
    handlerRef.current = handler
    window.addEventListener('devicemotion', handler)
    setStatus('enabled')
  }

  return { status, enable }
}
