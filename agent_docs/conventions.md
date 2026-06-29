# Conventions

Code style and patterns for this project. Authoritative for "how we write code here". Keep it pragmatic — this is a prototype, prefer working + swappable over clever.

## TypeScript

- **No `any`.** Use precise types; reach for `unknown` + narrowing if truly dynamic.
- Distinguish `null` vs `undefined` deliberately.
- Use **discriminated unions** for things with variants (game `phase`, view/control modes).
- **Type the data tables.** The face table (`{ value, normal }[]`) and the Zustand state shape are typed so a bad entry / a wrong field is a compile error.

## Naming & files

- Clear English names. Files/dirs `kebab-case`; React components `PascalCase`.
- One concern per file. Keep the **React-free physics helpers** (`readDieValue`, `rollDice`, the face table, thresholds) out of the components — they live in `src/physics/` and are unit-reasoned in isolation.
- Follow the layout in `AGENTS.md` (`scene/`, `physics/`, `state/`, `ui/`, `input/`, `textures/`).

## State — the one rule that matters here

- **Per-frame / physics state** (positions, rotations, velocities, "am I dragging") → **Rapier bodies via refs**, mutated inside **`useFrame`**. Never `setState`, never the store.
- **Discrete / meta state** (`phase`, settled `[d1, d2]`, `total`, `rolls`) → **Zustand only**, written **once per roll** at settle.
- The DOM UI **reacts** to Zustand; physics code reads/writes the store imperatively (`getState`/`setState`). **Never push ~60 fps updates through React or the store.**

If a task tempts you to store a position/rotation in React state or the store "just for now", stop — that's the invariant breaking. Put it in a ref.

## R3F / Rapier specifics

- **Verify the API against the installed version.** No R3F/Rapier skill is installed; prop/method names (`colliders`, `restitution`, `setLinvel`, `setAngvel`, `setNextKinematicTranslation`, `setBodyType`, `isSleeping`) move between majors. Don't trust half-remembered tutorials.
- **Preallocate hot-path temporaries.** `THREE.Quaternion` / `THREE.Vector3` used inside `useFrame` or `readDieValue` are created **once at module scope** (the `_q` / `_n` pattern in `physics.md`), not per call — no per-frame garbage.
- **Dice are homogeneous mass** (`colliders="cuboid"`, uniform density) — never weight a face by modelling its number as a heavy mesh. Fairness depends on it.
- **Drag handoff kinematic→dynamic is synchronous** in the pointer handler, never across a React render — no "between states" frame.
- **Dispose** `CanvasTexture`s if dice are ever recreated (they aren't in the prototype, but don't leak if that changes).

## Done means

- `typecheck` + `lint` pass.
- The dev-log entry is written (`agent_docs/dev_log.md`).
- A commit message is proposed for the change (see `workflow.md` step 5).

## Dependencies

Don't add libraries casually. The stack is **R3F + `@react-three/rapier` + `@react-three/drei` + `@react-three/postprocessing` + Zustand + Three**, in TypeScript. Justify anything new in the dev log.
