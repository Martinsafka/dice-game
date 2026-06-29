/** A static placeholder cube. M0 sanity check; the dynamic Die (M1+) replaces it. */
export function StaticBox() {
  return (
    <mesh castShadow position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e11d48" />
    </mesh>
  )
}
