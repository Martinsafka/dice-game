import { Vector3 } from 'three'

export type Face = { value: number; normal: Vector3 }

/**
 * The six die faces, in BoxGeometry's material-slot order: +X, −X, +Y, −Y, +Z, −Z.
 * Opposite faces sum to 7. This order MUST match `Die`'s face materials, or the rendered
 * number won't match the computed value (agent_docs/physics.md).
 */
export const FACES: readonly Face[] = [
  { value: 2, normal: new Vector3(1, 0, 0) },
  { value: 5, normal: new Vector3(-1, 0, 0) },
  { value: 1, normal: new Vector3(0, 1, 0) },
  { value: 6, normal: new Vector3(0, -1, 0) },
  { value: 3, normal: new Vector3(0, 0, 1) },
  { value: 4, normal: new Vector3(0, 0, -1) },
]
