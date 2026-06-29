import type { RapierRigidBody } from '@react-three/rapier'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/**
 * Throw the dice: lift each above the tray, spread them apart, and give it a random linear +
 * angular velocity. The spin on all axes is what keeps a physical die fair (enough entropy) —
 * see agent_docs/physics.md. RNG only seeds the throw; the result is read from where they land.
 */
export function rollDice(dice: RapierRigidBody[]) {
  const n = dice.length
  dice.forEach((rb, i) => {
    const x = (i - (n - 1) / 2) * 1.8 + rand(-0.2, 0.2)
    rb.setTranslation({ x, y: rand(3, 4), z: rand(-0.6, 0.6) }, true)
    rb.setLinvel({ x: rand(-2, 2), y: rand(2, 4), z: rand(-2, 2) }, true)
    rb.setAngvel({ x: rand(-15, 15), y: rand(-15, 15), z: rand(-15, 15) }, true)
  })
}
