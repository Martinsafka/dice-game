# Architecture

How the game is built at runtime. Authoritative for the renderer, the **state boundary**, the camera, and the component tree. For the Rapier/dice specifics (tray, die body, settle detection, reading the value, fairness, throw, drag), see `physics.md`.

## Responsibilities at a glance

| Layer | Owns |
| --- | --- |
| **R3F + Three** (renderer) | the `<Canvas>`, scene graph, orthographic camera, lights, the `useFrame` loop, postprocessing |
| **Rapier** (`<Physics>`) | rigid bodies, colliders, gravity, the ~60 fps simulation |
| **Refs** (`RapierRigidBody`) | **per-frame** physics access — read velocity/rotation, apply impulses, drive a drag — mutated inside `useFrame`, **never** via `setState` |
| **Zustand** | **discrete/meta** state — phase, settled `[d1, d2]`, total, roll count — the bridge to the UI |
| **DOM overlay** (React) | the HUD — total, Roll button, roll counter — reads Zustand |
| **Input** (pointer / `DeviceMotion`) | desktop drag-throw, mobile shake → impulses on the dice refs |

R3F is a **renderer, not a game framework** — we wire the scene, the physics, input, and state ourselves.

## State — two kinds, never mixed

This is the core invariant. Every value lives on exactly one side of this line.

- **Per-frame / physics state** (positions, rotations, velocities, who's being dragged) → **Rapier bodies, reached through refs**, mutated inside the **`useFrame`** loop. **Never** in Zustand or `setState`. A reactive update ~60×/s forces React to reconcile every frame — the classic perf footgun. This is the same principle as a game ticker mutating plain objects, just expressed through R3F refs.
- **Discrete / meta state** (`phase: "idle" | "rolling" | "settled"`, the settled result `[d1, d2]`, `total`, `rolls`) → **Zustand**. Event-driven, changes ≈ once per roll, the UI reacts to it.

Why both sides are mandatory: holding the **settled result** only in a ref would leave the UI (total, button label) stale; pushing **per-frame positions** into the store would tank performance. Each value on its own side.

Zustand works **outside React**: the settle watcher and input handlers read/write via `getState`/`setState`; the DOM overlay binds with hooks. It is the single shared state between the physics world and the React UI.

## Scene & camera (top-down)

- An **`OrthographicCamera`** above the origin looking straight down (position `[0, height, 0]`, target the origin). Ortho is the right call here: "which face is up" is visually unambiguous and there's no perspective distortion toward the edges — which also makes wall/settle tuning easier to eyeball.
- **Playfield = a fixed world-size tray** that fits the smallest viewport dimension. Start fixed (simplest); deriving the floor/wall extents from the camera frustum on every `resize` is a follow-up, not a prototype need.
- Keep the view **purely vertical** while tuning. A slight tilt for depth is a polish-time option (M6); a vertical camera keeps face-up detection trivial to verify by eye.

## Component tree

```
<DiceGame>                          // root: DOM overlay + Canvas; holds the dice refs
  ├─ <UIOverlay/>                   // DOM, reads Zustand: total, phase, Roll button, roll count
  ├─ <Canvas orthographic ...>
  │    ├─ <Lights/>
  │    ├─ <Physics>
  │    │    ├─ <Tray/>              // floor + 4 fixed walls
  │    │    ├─ <Die id={0} ref={d0}/>
  │    │    └─ <Die id={1} ref={d1}/>
  │    ├─ <SettleWatcher dice=.../> // useFrame: detect rest → readDieValue → setResult
  │    └─ <EffectComposer> ...      // toon / outline (M6 only)
  └─ <InputController dice=.../>    // desktop drag (raycast) + mobile DeviceMotion
```

**The dice refs are owned at the top** (`useRef<RapierRigidBody>(null)` per die in `DiceGame`) and passed down into `SettleWatcher`, `InputController`, and the roll action. Everything that touches a die per-frame goes through these refs.

## Result flow (one store write per roll)

1. **Throw** → `startRoll()` sets `phase = "rolling"` (+ bumps `rolls`) and applies the impulse to each die ref.
2. **Simulate** → Rapier runs; nothing touches the store.
3. **Settle** → `SettleWatcher` (in `useFrame`) sees both dice below the velocity threshold for N consecutive frames.
4. **Read** → `readDieValue(ref)` per die (quaternion → up face). If **any** die is cocked (`confidence < ~0.95`), hold/nudge and keep watching — **don't** write.
5. **Commit** → `setResult([d1, d2])` sets `phase = "settled"`, `results`, `total`. **This is the only store write in the whole roll**, and it's what the UI re-renders on.

The detail of steps 3–4 (thresholds, the quaternion read, cocked handling) lives in `physics.md` — this doc owns the *shape* of the flow, that doc owns the *mechanics*.

## UI layer

- The HUD (total, Roll button, roll counter) is a **DOM overlay positioned over the canvas**, not built from Three meshes. R3F has no layout engine; building UI from meshes is painful, and the HUD sits on top and occludes nothing in the world.
- World = the Canvas; chrome = the React layer on top. They communicate **only** through Zustand.

## Input

- **Desktop drag-throw** and **mobile shake** both end the same way: an **impulse on a die ref**. They're just two sources of the same per-frame mutation. The "am I dragging" flag is per-frame ref state; it reaches the store only if the UI needs it (e.g. a cursor change).
- See `physics.md` for the drag handoff detail (velocity-based now; a kinematic upgrade later) and the mobile `DeviceMotion` permission gate.
