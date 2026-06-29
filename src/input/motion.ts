type PermissionApi = { requestPermission?: () => Promise<'granted' | 'denied' | 'default'> }

const ask = (api: PermissionApi | undefined) =>
  typeof api?.requestPermission === 'function'
    ? api.requestPermission()
    : Promise.resolve('granted' as const)

/**
 * Request iOS 13+ permission for motion (shake) AND orientation (tilt). MUST be called straight
 * from a user gesture (a tap): both requestPermission calls are kicked off synchronously via
 * Promise.all, so iOS counts them as gesture-initiated (awaiting one before calling the other can
 * fail). HTTPS is required for these events to fire at all — hence the GitHub Pages build. Android
 * needs no prompt (the APIs just work).
 */
export async function requestMotionPermission(): Promise<'enabled' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return 'unsupported'
  const w = window as unknown as {
    DeviceMotionEvent?: PermissionApi
    DeviceOrientationEvent?: PermissionApi
  }
  try {
    const [motion, orientation] = await Promise.all([
      ask(w.DeviceMotionEvent),
      ask(w.DeviceOrientationEvent),
    ])
    return motion === 'granted' && orientation === 'granted' ? 'enabled' : 'denied'
  } catch {
    return 'denied'
  }
}
