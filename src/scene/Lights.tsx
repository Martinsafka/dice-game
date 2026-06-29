/** Ambient fill + a shadow-casting key light. Shared by the scene. */
export function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
      />
    </>
  )
}
