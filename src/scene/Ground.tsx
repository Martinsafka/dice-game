/** The floor plane. M0: visual context + a shadow catcher. Becomes the tray floor in M1. */
export function Ground() {
  return (
    <mesh receiveShadow rotation-x={-Math.PI / 2}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  )
}
