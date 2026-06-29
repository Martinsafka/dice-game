# Physics & dice

The Rapier/dice deep dive — the heart of the game. Authoritative for the tray, the die body, **settle detection**, reading the value from the quaternion, cocked-die handling, fairness, the throw, and the drag handoff. For the runtime _structure_ (state boundary, component tree, result flow), see `architecture.md`.

> **Version caveat:** there is no installed R3F/Rapier skill. The exact `@react-three/rapier` prop/method names (`colliders`, `restitution`, `setLinvel`, `setAngvel`, `setNextKinematicTranslation`, `setBodyType`, `isSleeping`) shift between majors — **verify against the installed version**. Snippets here are shape, not gospel.

## Principle

The result comes from **where the dice land**, not from RNG. Everything per-frame (positions, velocities, drag) is touched through **refs inside `useFrame`** — never `setState`. The only write to the store is the settled `[d1, d2]` (see `architecture.md`).

## The tray (floor + 4 fixed walls)

A fixed floor plus four fixed wall colliders around the edge. Walls tall enough that a hard throw can't pop a die out.

```tsx
function Tray({ size = 6, wallH = 4, t = 0.5 }) {
  const h = size / 2
  return (
    <>
      {/* floor */}
      <RigidBody type="fixed" friction={0.9}>
        <mesh receiveShadow rotation-x={-Math.PI / 2}>
          <planeGeometry args={[size, size]} />
          <meshStandardMaterial />
        </mesh>
      </RigidBody>

      {/* 4 walls — fixed boxes around the edge (invisible: collider, no mesh) */}
      <RigidBody type="fixed" position={[0, wallH / 2, -h]}>
        <CuboidCollider args={[h, wallH / 2, t / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, wallH / 2, h]}>
        <CuboidCollider args={[h, wallH / 2, t / 2]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-h, wallH / 2, 0]}>
        <CuboidCollider args={[t / 2, wallH / 2, h]} />
      </RigidBody>
      <RigidBody type="fixed" position={[h, wallH / 2, 0]}>
        <CuboidCollider args={[t / 2, wallH / 2, h]} />
      </RigidBody>
    </>
  )
}
```

A `CuboidCollider` with no mesh is invisible — wrap it in a `mesh` temporarily to debug placement.

## The die: geometry, faces, and the material order

For the prototype: a procedural `boxGeometry` with **six materials** (one per face). The number is drawn onto a coloured square via `CanvasTexture` — no asset pipeline.

**Critical detail — material order is fixed.** `BoxGeometry`'s material array is ordered `[+X, −X, +Y, −Y, +Z, −Z]`. This order **must** match the face table used by the value detection below, or the rendered number won't match the computed value. A standard die has opposite faces summing to **7**:

| index | face | normal     | value |
| ----- | ---- | ---------- | ----- |
| 0     | +X   | ( 1, 0, 0) | 2     |
| 1     | −X   | (−1, 0, 0) | 5     |
| 2     | +Y   | ( 0, 1, 0) | 1     |
| 3     | −Y   | ( 0,−1, 0) | 6     |
| 4     | +Z   | ( 0, 0, 1) | 3     |
| 5     | −Z   | ( 0, 0,−1) | 4     |

```tsx
const Die = forwardRef<RapierRigidBody, { id: number }>(function Die({ id }, ref) {
  // 6 CanvasTexture materials, ordered to match the table above
  const materials = useMemo(() => makeNumberMaterials(), [])
  return (
    <RigidBody ref={ref} colliders="cuboid" restitution={0.3} friction={0.8}>
      <mesh castShadow material={materials}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </RigidBody>
  )
})
```

Later upgrade to a nicer die (rounded edges, engraved pips): Blender → GLB with Draco + KTX2. For the prototype the procedural box is plenty — and swapping it is a data change, not a refactor.

## Reading the result — "which face is up" (the heart)

After rest, take the die's world rotation (quaternion), rotate each face's local normal into world space, and pick the one whose world-normal points most "up" (largest dot with `(0, 1, 0)`).

```ts
import * as THREE from 'three'
import type { RapierRigidBody } from '@react-three/rapier'

const UP = new THREE.Vector3(0, 1, 0)

// order matches the BoxGeometry materials: +X, −X, +Y, −Y, +Z, −Z
const FACES: { value: number; normal: THREE.Vector3 }[] = [
  { value: 2, normal: new THREE.Vector3(1, 0, 0) },
  { value: 5, normal: new THREE.Vector3(-1, 0, 0) },
  { value: 1, normal: new THREE.Vector3(0, 1, 0) },
  { value: 6, normal: new THREE.Vector3(0, -1, 0) },
  { value: 3, normal: new THREE.Vector3(0, 0, 1) },
  { value: 4, normal: new THREE.Vector3(0, 0, -1) },
]

// preallocated — don't garbage a Quaternion/Vector3 every frame
const _q = new THREE.Quaternion()
const _n = new THREE.Vector3()

export function readDieValue(rb: RapierRigidBody) {
  const r = rb.rotation() // { x, y, z, w }
  _q.set(r.x, r.y, r.z, r.w)

  let best = -Infinity
  let value = 0
  for (const f of FACES) {
    _n.copy(f.normal).applyQuaternion(_q)
    const d = _n.dot(UP)
    if (d > best) {
      best = d
      value = f.value
    }
  }
  // best ≈ 1 → a face lies flat on top
  // best < ~0.95 → the die is cocked (leaning), result is ambiguous
  return { value, confidence: best }
}
```

`_q` and `_n` are preallocated **outside** the function so the per-frame path doesn't garbage — small but correct hygiene (see `conventions.md`).

## Cocked die (a die resting on an edge)

The sim will occasionally leave a die leaning against a wall. When `confidence < ~0.95` the result is ambiguous and **must not** be committed. Two options:

- **Nudge:** `applyImpulse` upward + a random `torqueImpulse`, then wait for a fresh settle.
- **Re-roll** that die.

For the prototype either is fine — but the value path must **never** return a nonsense result. This is an invariant (`AGENTS.md`).

## Settle detection — per-frame, through refs

The canonical "work per-frame through refs, write to the store only at the end" case. Watch the magnitude of both linear and angular velocity; when both stay under a threshold for several consecutive frames, it's settled.

```tsx
function SettleWatcher({ dice }: { dice: RefObject<RapierRigidBody>[] }) {
  const phase = useGameStore((s) => s.phase)
  const setResult = useGameStore((s) => s.setResult)
  const stable = useRef(0)

  useFrame(() => {
    if (phase !== 'rolling') return

    const calm = dice.every((ref) => {
      const rb = ref.current
      if (!rb) return false
      const lv = rb.linvel(),
        av = rb.angvel()
      const linSq = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z
      const angSq = av.x * av.x + av.y * av.y + av.z * av.z
      return linSq < 1e-3 && angSq < 1e-3
    })

    if (!calm) {
      stable.current = 0
      return
    }

    if (++stable.current > 12) {
      // ~0.2 s at 60 fps
      const res = dice.map((ref) => readDieValue(ref.current!))
      if (res.some((r) => r.confidence < 0.95)) return // cocked → keep watching / nudge
      setResult(res.map((r) => r.value)) // ← the single store write per roll
      stable.current = 0
    }
  })

  return null
}
```

**Alternative:** Rapier exposes `rb.isSleeping()`. Auto-sleep can help _or_ fight the detector (it may sleep a die that's still settling, or sleep late). **Start with velocity thresholding** — you have full control — and consider `isSleeping` only while tuning.

## The throw (random impulses) + fairness

```ts
const rand = (a: number, b: number) => a + Math.random() * (b - a)

function rollDice(dice: RapierRigidBody[]) {
  for (const rb of dice) {
    rb.setLinvel({ x: rand(-2, 2), y: rand(3, 6), z: rand(-2, 2) }, true)
    rb.setAngvel({ x: rand(-15, 15), y: rand(-15, 15), z: rand(-15, 15) }, true)
  }
}
```

**Fairness** holds only when (a) the die is geometrically symmetric with a **homogeneous mass distribution** (`colliders="cuboid"` + uniform density gives this — **never** model the numbers as heavy meshes), and (b) the throw has **enough entropy**. A weak or uniform throw biases the distribution — hence the random angular velocity on **all** axes and a decent starting spin. If you want to check it, histogram a few hundred rolls (1–6) and tune.

## Drag handoff (control scheme)

**Start velocity-based** (no body-type switching; "grab and throw" falls out of residual velocity):

1. `pointerdown` on a die → record it as dragged, capture the pointer (the die stays `dynamic`).
2. In `useFrame`, raycast the pointer onto the plane `y = dieHeight` → a target point; `rb.setLinvel(clamp((target − pos) * stiffness), true)`.
3. `pointerup` → do nothing further; the residual velocity **is** the throw. Add a random `setAngvel` so it spins.

Simple, and the throw "just works". Downside: a violent yank can tunnel a die through a wall.

**Upgrade (more control):** drag as a **kinematic** body — `setBodyType(KinematicPositionBased)`, `setNextKinematicTranslation(target)` each frame, track the last few positions + time. On `pointerup`, switch back to `dynamic` and imperatively `setLinvel` from the computed throw velocity + `setAngvel`. **Do the kinematic→dynamic handoff synchronously in the handler** (not through a React render) so there's no frame where the body is "between states".

Either way the principle holds: the "am I dragging" flag is **per-frame ref state**; it reaches the store only if the UI depends on it.

## Mobile shake (`DeviceMotion`)

```ts
const SHAKE = 25 // threshold — tune on a real device

async function enableMotion(): Promise<boolean> {
  const D = window.DeviceMotionEvent as any
  if (typeof D?.requestPermission === 'function') {
    const res = await D.requestPermission() // iOS 13+: MUST be called from a user gesture (tap)
    if (res !== 'granted') return false
  }
  window.addEventListener('devicemotion', onMotion)
  return true
}

function onMotion(e: DeviceMotionEvent) {
  const a = e.accelerationIncludingGravity
  if (!a) return
  const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0)
  if (mag > SHAKE) triggerRoll() // + a short debounce: one shake = one roll
}
```

Two gotchas that otherwise eat an afternoon:

- **HTTPS is mandatory.** `DeviceMotion` is dead in an insecure context.
- **iOS needs an explicit permission gate fired from a tap** (an "Allow motion / Shake" button). Android usually doesn't, but keep the gate anyway — it unifies the flow.

**Testing on a real phone:** the dev build must reach the phone over HTTPS. Run Vite with `--host` and serve it over your Tailscale tailnet, or use `vite-plugin-mkcert` for a local HTTPS cert. No public tunnel needed.
