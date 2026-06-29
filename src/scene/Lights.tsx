/** Ambient + hemisphere fill and a shadow-casting key light (basic PCF shadows — cheap). */
export function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#dbeafe', '#0f172a', 0.5]} />
      <directionalLight
        position={[4, 9, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
      />
    </>
  )
}
