# AGENTS.md

Shared instructions for coding agents on this project. Keep this lean — read the linked docs with your file-reading tool **only when a task actually needs them**.

## What this repo is

A top-down **3D dice game** for the web. Two physical dice sit in a small tray; the player throws them and the result is **read from where the dice actually land** — the face pointing up after they come to rest — **not** from a random number generator. Right now it is a **prototype / tech demo**.

Mindset: this is a small spike. **Ship a playable "throw → settle → read" loop.** Functional code is the priority; pretty dice are a swappable layer that can be deferred (a procedural box with number faces is a valid prototype look). A game layer (score, goal, win) sits **on top** of the demo and is out of scope for now.

Stack: **React Three Fiber** (R3F — the React renderer for Three.js) + **`@react-three/rapier`** (physics) + **`@react-three/drei`** (helpers) + **`@react-three/postprocessing`** (visual polish) + **Zustand** (discrete state), in **TypeScript**, bundled with **Vite** + **pnpm** (lint: **ESLint + Prettier**). Dice are procedural `boxGeometry` with six `CanvasTexture` number faces (1–6).

There is **no installed Claude skill** for R3F / Rapier / Three. Verify the exact `@react-three/rapier` API (prop and method names like `colliders`, `restitution`, `setLinvel`, `setAngvel`, `setNextKinematicTranslation`, `setBodyType`) against the **installed version** — these shift between majors. Treat the snippets in `agent_docs/` as shape, not gospel.

## How to approach any task — read this first

Follow the loop in `agent_docs/workflow.md` for **every** assignment: analyze → propose architecture → execute → log → propose commit message → point to next. Do not skip the analysis or the log.

## Layout (starting target — adjust as the project grows, and record changes in the dev log)

The project is **not scaffolded yet** (that's M0 in the roadmap). This is the intended shape:

- `src/scene/` — everything rendered **inside `<Canvas>`**: `Tray` (floor + 4 walls), `Die`, `Lights`, `SettleWatcher`, postprocessing. The R3F "world".
- `src/physics/` — **React-free** helpers: the face table, `readDieValue` (quaternion → which face is up), `rollDice` (impulses), settle thresholds.
- `src/state/` — Zustand store (discrete/meta state only).
- `src/ui/` — DOM overlay over the canvas (total, Roll button, roll counter) — reads Zustand.
- `src/input/` — desktop drag-throw (pointer raycast) + mobile `DeviceMotion` shake; both apply impulses to the dice refs.
- `src/textures/` — procedural number `CanvasTexture` materials for the dice faces.
- `src/DiceGame.tsx` — root composition (DOM overlay + `<Canvas>`).

## Read before acting — progressive disclosure

Pull the relevant doc(s) into context **only when the task needs them**:

- Vision, scope, what's in / out, the core loop → `agent_docs/project_brief.md`.
- Runtime architecture: the **physics/state boundary**, scene + ortho camera, component tree, result flow → `agent_docs/architecture.md`.
- The Rapier/dice deep dive: tray, die body, **settle detection**, reading the value from the quaternion, cocked-die handling, fairness, the throw, drag handoff → `agent_docs/physics.md`.
- Code style, naming, the ref-vs-store rule, TypeScript rules, per-frame hygiene → `agent_docs/conventions.md`.
- How to approach tasks (the loop) → `agent_docs/workflow.md`.
- What's been done and why (running log — **append after every task**) → `agent_docs/dev_log.md`.
- Milestones + what's next → `agent_docs/roadmap.md`.

## Working rule

**Run typecheck + lint before reporting a task done.** Target toolchain: **Vite + pnpm + TypeScript**, lint via **ESLint + Prettier**. Intended commands (wired in M0):

- `pnpm dev` — Vite dev server (HMR / React Fast Refresh)
- `pnpm build` — typecheck (`tsc --noEmit`) + production build
- `pnpm typecheck` — types only
- `pnpm lint` / `pnpm lint:fix`
- `pnpm format` / `pnpm format:check`

Vite was chosen deliberately over Next.js: this is a client-only WebGL toy, Three touches `window`/WebGL, and SSR is pure friction. Same toolchain as the team's other projects.

## Non-negotiable invariants

- **The physics/state boundary.** Per-frame physics — position, rotation, velocity, drag — lives in **Rapier** and is reached via **refs** (`RapierRigidBody`), mutated inside **`useFrame`**. **Never** push it through `setState` / the store. Discrete game state (phase, settled result `[d1, d2]`, total, roll count) lives in **Zustand**, written **only at settle** (≈ once per roll). A reactive update ~60×/s forces React reconciliation every frame → jank.
- **The result is read from physics, never RNG.** The die value comes from the body's **world rotation** (which face's normal points most "up"), not `Math.random()`. RNG only seeds the **throw** (entropy). This is the entire point of the project.
- **The scene renders inside `<Canvas>`; UI chrome is a DOM overlay on top.** Dice / tray / lights / effects are R3F inside the Canvas; HUD and buttons are DOM that reads Zustand. Don't build the HUD out of Three meshes.
- **Fairness.** A physical die is fair only with **symmetric geometry + homogeneous mass** (`colliders="cuboid"` + uniform density — never model the numbers as heavy meshes) **and enough entropy** in the throw (random angular velocity on all axes).
- **Cocked-die safety.** An ambiguous rest (read `confidence < ~0.95`, the die leaning on a wall) must **never** write a result. Nudge or re-roll. The game must never return a nonsense value.
- **Face table ↔ material order stay in sync.** `BoxGeometry`'s material order is fixed `[+X, −X, +Y, −Y, +Z, −Z]` and **must** match the face/value table in `physics.md`, or the rendered number won't match the computed value.
- **Strong types.** No `any`; distinguish `null` vs `undefined`. Type the face table so a bad entry is a compile error.
- **Log every task.** After finishing, append a `dev_log.md` entry (what / why / how). Not optional.

If a request conflicts with these invariants or `agent_docs/conventions.md`, **refuse and explain why** — do not silently comply, and do not work around the rule. If a rule is unclear, assume the stricter interpretation.
