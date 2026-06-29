# Dev Log

Running log of changes — the project's memory for future sessions. **Append a new entry after every task** (newest at the top). Keep entries concrete and skimmable, not verbose.

## How to write an entry

Each entry has: a dated title, then **What / Why / How** (and optional **Follow-ups**):

- **What** — what changed (files / features touched).
- **Why** — the goal or reason.
- **How** — approach taken, key decisions, tradeoffs, anything non-obvious the next session needs.
- **Follow-ups** — known gaps, TODOs, deferred items (optional).

Example shape:

> ### 2026-06-29 — Settle detection + read-from-physics
>
> **What:** Added `src/physics/read-die.ts`, `src/scene/SettleWatcher.tsx`; logs `[d1, d2]` after the dice rest.
> **Why:** M2 — prove the result is read from the simulation, not RNG.
> **How:** Velocity-threshold settle in `useFrame` (12 calm frames); value from the world quaternion (max dot with UP). Cocked dice (`confidence < 0.95`) are not committed. Preallocated `_q`/`_n` to avoid per-frame GC.
> **Follow-ups:** Cocked-die nudge not wired yet (currently just keeps watching).

---

<!-- Newest entries below. Add yours on top of the list. -->

### 2026-06-29 — Mobile tilt → physics (gravity from device orientation)

**What:** Tilting the phone now moves the dice physically — `src/input/TiltGravity.tsx` maps `DeviceOrientation` (beta/gamma) to the Rapier world's horizontal gravity. Unified the motion permission (shake + tilt) into `src/input/motion.ts` + a `motionStatus` store field; the button is now "Enable tilt & shake". Shake itself confirmed working on a real device by the user.
**Why:** User request — small tilt = dice slide, big tilt = dice fly wall-to-wall (the brief's tilt bonus). Same "read from physics" spirit as the drag: a real force, not a scripted animation.
**How:** `useRapier().world.gravity` (verified `World.gravity: Vector`, a public mutable field) is mutated imperatively inside the `deviceorientation` handler — never via React state, so no re-render / physics reset. The pose at enable time is captured as the neutral baseline (calibrated on the first event) and tilt is measured as a delta, so it works however the phone is held. `MAX_TILT_DEG=40` normalizes to ±1, ×`TILT_GRAVITY=22` horizontal (vs −9.81 down) → gentle slide at small angles, hard slam at large. Permission for motion+orientation is requested together via `Promise.all` (both `requestPermission` kicked off synchronously so iOS accepts the single gesture). `motionStatus` in the store is the bridge: the DOM button sets it; `TiltGravity` (inside `<Physics>`) and the refactored `useShakeToRoll` both attach their listeners when it flips to `enabled`.
**Follow-ups:** On-device tuning — `SIGN_X`/`SIGN_Z` (flip if a tilt slides the wrong way), `TILT_GRAVITY`, `MAX_TILT_DEG`. Screen orientation (portrait↔landscape) remaps beta/gamma; only portrait is handled — a `screen.orientation` correction is a follow-up. Rolling while holding the phone near-vertical makes the up-face read ambiguous (dice rest against a wall) — fine for flat-ish play.

### 2026-06-29 — Perf fix: drop SoftShadows + cap DPR (M6 regression)

**What:** Removed drei `<SoftShadows>`, dropped the shadow map 2048 → 1024, and capped the Canvas `dpr` to `[1, 1.5]`.
**Why:** M6 made the scene GPU-heavy enough to jank the browser **and the whole machine** (the IDE froze) — reported by the user.
**How:** `<SoftShadows>` (PCSS, 16 samples per fragment, every frame under the continuous render loop) was the dominant cost; basic PCF shadows read fine here. On a Retina display the canvas was rendering at dpr 2 (4× the fragments) — capping to 1.5 roughly halves fragment work. Toon + `<Outlines>` kept (cheap). CPU side (3 `useFrame` loops + 2-body physics) was never the issue — this was pure fragment/GPU cost.
**Follow-ups:** Not verifiable headlessly — needs the user's machine. If a weak GPU still struggles, escalation levers in order: `dpr={[1, 1]}` → turn shadows off (Canvas `shadows` + the cast/receive flags) → fewer dice. `frameloop` stays "always" (Rapier steps in the loop, so on-demand isn't a drop-in).

### 2026-06-29 — M5 gyro shake + M6 polish + GitHub Pages deploy

**What:** M5 — `src/input/useShakeToRoll.ts` (DeviceMotion shake → roll with the iOS permission gate) + a touch-only "📱 Shake to roll" button in `UIOverlay`. M6 — toon dice (`MeshToonMaterial`) + drei `<Outlines>`, drei `<SoftShadows>` + a hemisphere fill + a sharper 2048 shadow map, and a felt-green tray floor. Deploy — `.github/workflows/deploy.yml` (build → Pages) + `base: '/dice-game/'` for the production build in `vite.config.ts`.
**Why:** Finish the input + visual milestones; M5 can only be verified on a phone over HTTPS, so ship a Pages deploy to test it there (user's plan).
**How:** Shake — `enable()` runs from the button tap (iOS 13+ grants motion only from a gesture; DeviceMotion needs HTTPS at all → Pages), then listens to `devicemotion` and fires the roll when |accel incl. gravity| > threshold (debounced); listener added imperatively, cleaned up on unmount; the button shows only on `(pointer: coarse)`. The handler closes over the (stable) `onShake` rather than a ref, to satisfy `react-hooks/refs`. Polish — kept the number CanvasTextures but on `MeshToonMaterial`; drei `<Outlines>` gives the cel edge (default MSAA antialiases it, so no postprocessing dep); `<SoftShadows>` + hemisphere fill + bias clean up the shadows; felt-green floor. Pages — `defineConfig(({ command }))` sets `base` to `/dice-game/` on build only (dev stays `/`); verified the built `index.html` references `/dice-game/assets/…`; the workflow installs with pnpm + Node 22, uploads `dist`, deploys via the official Pages actions.
**Follow-ups:** **One-time GitHub setup (user):** create the `dice-game` repo under the same account, push `main`, then repo Settings → Pages → Source = **GitHub Actions**. If the repo name isn't `dice-game`, change `REPO` in `vite.config.ts`. Shake threshold/debounce + the M6 feel values (toon look, outline thickness, soft-shadow size, felt colour) want on-device / visual tuning. Optional later: postprocessing (vignette/bloom), engraved-pip GLB dice, kinematic drag handoff. (Invoke scripts as `pnpm run <script>` — the bare `pnpm <script>` shorthand hiccuped once with a corepack "use yarn" message.)

### 2026-06-29 — Drag-all: grab every die, dangle from a corner (M4 refinement)

**What:** Reworked the drag from per-die grab into **drag-all**. Pressing the tray grabs ALL dice toward the cursor; each is pulled by a spring impulse applied at one corner (`applyImpulseAtPoint`) so it hangs and swings from that corner under gravity — full physics, they still collide. Dice shrink slightly while held (visual mesh scale only) to fake "lifted" under the ortho camera; extra linear/angular damping keeps the dangle gentle; release adds a spin + `startRoll`. `Die` lost `index`/`onGrab`, gained a `dragging` ref + a scale lerp; `DiceGame` swapped `dragIndex` → a `dragging` boolean ref and starts the drag on canvas pointer-down; CSS grab/grabbing cursor on `.game`.
**Why:** User request — grab all dice at once, keep them physically simulated, dangle them at the cursor pulled by a corner, with a perspective-y shrink so they read as airborne.
**How:** Ortho top-down ⇒ a vertical pick ray, so the cursor maps to one (x,z) column and all dice are pulled to (cursorX, DRAG_HEIGHT, cursorZ). The local corner (0.5,0.5,0.5) is rotated by the die's current quaternion to a world point; a damped, clamped spring impulse is applied THERE — the off-centre force makes torque = the dangle. The collider stays full size while only the mesh scales (so it's consistent again on release). Tunables are grouped at the top of `DiceDragControls` (PULL / DAMP / MAX_IMPULSE / DRAG_HEIGHT / CORNER), `DiceGame` (drag damping), and `Die` (DRAG_SCALE).
**Follow-ups:** Feel constants are a first pass — **needs hands-on tuning in a browser** (spring strength, damping, lift height, scale amount). Fast yanks can still tunnel despite `ccd`. Kinematic handoff remains the deeper-control follow-up.

### 2026-06-29 — M4 desktop drag-throw

**What:** `src/input/DiceDragControls.tsx` — grab a die (its mesh `onPointerDown` sets `dragIndex`), drag it (raycast the cursor onto a y=1 plane, drive it there with `setLinvel`), release to throw (residual velocity + a random spin + `startRoll`). `Die` gained `index` / `onGrab` props + a grab cursor + `ccd`; `DiceGame` owns `dragIndex` and mounts the controller. Removed the click-anywhere-to-roll (it conflicted with grabbing); the Roll button still throws both dice.
**Why:** M4 — let the player grab and throw a die with the mouse.
**How:** Velocity-based (per physics.md): each frame the grabbed die's linvel is set toward the cursor's plane projection (clamped to MAX_DRAG_SPEED to limit tunnelling; `ccd` on the dice for the same reason), so a flick leaves real residual velocity = the throw, a gentle release just places it. Release fires `startRoll` so SettleWatcher re-reads both dice (a throw counts as a roll). Pure ref / imperative work — `dragIndex` + bodies are refs read only in the frame loop and the window `pointerup` handler (no React state). `useThree` selectors give camera / raycaster / pointer; the overlay stays `pointer-events: none` so grabs reach the dice.
**Follow-ups:** Kinematic drag handoff (switch to KinematicPositionBased while dragging, hand back to dynamic on release — more control, no tunnelling) deferred per the roadmap. Fast yanks can still occasionally tunnel despite the clamp + ccd. Next: M5 — mobile gyro shake.

### 2026-06-29 — Number faces on the dice (verification aid; M6 pulled forward)

**What:** `src/textures/number-materials.ts` (`getNumberMaterials` — six `CanvasTexture` materials, a digit on a light square) replaces the Die's six colour materials.
**Why:** Make the read trivially verifiable by eye — read the number on the top face and check it against the Total, instead of mapping colours (user request).
**How:** Digits come from the `FACES` table (single source of truth), in BoxGeometry order (+X,−X,+Y,−Y,+Z,−Z), so the rendered up-face always matches `readDieValue`. Materials are a lazily-built module singleton shared by both dice (no per-die duplication). Procedural canvas, no asset pipeline — the M6 "number textures" item, pulled forward.
**Follow-ups:** Per-face UV rotation not handled — a top digit may read rotated 90° / 180° (still legible; cosmetic, fits M6). "Nicer textures / decals + a subtler tray + toon / outline" remain M6.

### 2026-06-29 — M3 two dice + Zustand store + DOM overlay (playable)

**What:** `src/state/game-store.ts` (Zustand: phase/results/total/rolls + startRoll/setResult), `src/physics/roll.ts` (`rollDice`), `src/ui/UIOverlay.tsx` (DOM HUD: dice values, total, roll counter, Roll button) + overlay CSS in `index.css`. `DiceGame` mounts two dice, wires the store, and rolls on the button or a tray click. `SettleWatcher` now reads the store phase and writes `setResult` once on settle, with a cocked-die nudge. Removed the Die's fixed M1 spin.
**Why:** M3 — make it playable: throw two dice, read both from physics, show the total; one store write per roll.
**How:** The physics/state boundary holds — per-frame stays in refs/`useFrame`; the store is written exactly twice per roll (startRoll on throw, setResult on settle). `DiceGame` doesn't subscribe to the store (actions via `getState`), so it never re-renders → die props stay stable, physics undisturbed; only `UIOverlay` subscribes (re-renders once per roll). The phase gate gives one-report-per-roll for free (setResult → 'settled' closes the gate). Cocked dice self-resolve: nudge up + random torque, keep watching. **Ref-handling fix:** eslint-plugin-react-hooks 7's `react-hooks/refs` rule forbids passing an **array of refs** through render (`dice.map` / `dice={dice}`); switched to one `useRef<RapierRigidBody[]>` the dice register into via ref callbacks, read only in handlers / `useFrame`. Overlay is click-through (`pointer-events: none`) except the button, so clicking the tray rolls too.
**Follow-ups:** Playable but **not yet visually verified** in a browser (toolchain gates only). `rollDice` lifts + repositions the dice each throw (a clean toss); the in-place residual-velocity throw is the M4 drag model. Faces are still colours (numbers are polish, M5/M6). Next: M4 — desktop drag/throw (pointer raycast → velocity drag).

### 2026-06-29 — M2 settle detection + read-from-physics ⭐ (the core)

**What:** `src/physics/{faces.ts, read-die.ts, settle.ts}` (React-free: the face table in BoxGeometry order, `readDieValue` → `{ value, confidence }`, tuning constants) and `src/scene/SettleWatcher.tsx` (per-frame rest detection in `useFrame`). `DiceGame` mounts the watcher on the die and logs `[settle] value = total (confidence …)` on each rest.
**Why:** M2 — the core milestone: prove the die value is read from the simulation (world quaternion → which face is up), not RNG.
**How:** `readDieValue` rotates each face normal by the body's world quaternion and argmaxes the dot with UP; preallocated `_q` / `_n` (runs per frame, no GC). Hand-derived the table against 6 known orientations (identity→1, 180°X→6, 90°X→4, −90°X→3, 90°Z→2, −90°Z→5). No store yet (M3), so `SettleWatcher` is **edge-triggered** (tracks moving→calm) and reports via an `onSettle` callback instead of a store-phase gate — dice moving again (a new throw) re-arms it. Cocked dice (`confidence < 0.95`) are never reported (warn-once, keep watching). Watcher uses only refs — no React state (the physics/state boundary).
**Follow-ups:** **Eye-check pending** — value-matches-up-face needs a browser (console + map the top face's colour via `FACE_COLORS` to the logged value; faces show colours, not numbers, until polish). Cocked-die nudge not wired (warns + waits). Still one die. M3 swaps `onSettle` for the single `setResult` store write + a phase gate, adds the 2nd die, a Roll button → `rollDice`, and the DOM overlay.

### 2026-06-29 — M1 physical tray + dynamic die

**What:** `src/scene/Tray.tsx` (fixed floor + 4 wall colliders) and `src/scene/Die.tsx` (a dynamic `colliders="cuboid"` box with 6 distinct face colours). `DiceGame` now wraps the scene in `<Physics>`, drops the die, and re-throws it on click. Removed the M0 `Ground` / `StaticBox` placeholders.
**Why:** M1 — get a die falling, bouncing, and settling inside a tray; the first real Rapier integration.
**How:** Verified the @react-three/rapier 2.2 API against the installed types before coding (`RigidBody` `type`/`colliders`/`linearVelocity`/`angularVelocity`; `CuboidCollider` `args` + `position`; `Physics` `gravity`/`debug`; `RapierRigidBody` methods). Floor = a visible plane **plus** an explicit thin `CuboidCollider` slab (a bare plane gives a degenerate auto-collider) — a deliberate tweak to the physics.md snippet; the 4 walls are collider-only cuboids grouped in one fixed body. Die faces use 6 `attach="material-N"` materials in BoxGeometry order (+X,−X,+Y,−Y,+Z,−Z) so M2 can swap colours → number textures in place. The die ref lives in `DiceGame` (the architecture's "refs owned at the top"); a temporary `throwDie(rb)` on canvas `onPointerDown` (setTranslation/setLinvel/setAngvel) stresses the walls — superseded by `rollDice` (M3) + real input (M4). `SHOW_COLLIDERS` → `<Physics debug>` shows collider wireframes for tuning.
**Follow-ups:** Bundle jumped to ~1.15 MB gzip — rapier's `rapier3d-compat` inlines its WASM as base64 (expected; code-splitting deferred, YAGNI). Tuning constants are eyeballed at one setting; revisit with two dice + real throws (M3). Physics **behaviour** needs a browser to confirm (`pnpm dev`); the toolchain gates only prove it compiles + integrates. Settle detection + `readDieValue` are M2.

### 2026-06-29 — M0 scaffold (Vite + R3F + Rapier + Zustand)

**What:** Scaffolded the app: `package.json`, `vite.config.ts`, single `tsconfig.json`, `eslint.config.js`, prettier/gitignore, `index.html`, and `src/{main.tsx, DiceGame.tsx, index.css, vite-env.d.ts, scene/{Lights, Ground, StaticBox}.tsx}`. A top-down orthographic scene renders a static red box on a ground plane with shadows.
**Why:** M0 — get something on screen and wire the toolchain (`dev` / `build` / `typecheck` / `lint`) before any physics.
**How:** Manual scaffold (not `create-vite`) to avoid clobbering the existing docs / `.git`. Installed latest, all aligned: React 19.2, R3F 9.6, drei 10.7, **@react-three/rapier 2.2**, three 0.185, zustand 5.0, Vite 8.1, TS 6.0. Mirrored pixin's house config (single `tsconfig.json`, the `tseslint.config` eslint with enforced `no-explicit-any`, prettier `printWidth 100`). `build.target: 'esnext'` set — same top-level-await reason as pixin, here for rapier's `@dimforge/rapier3d-compat`. Straight-down camera via `camera.rotation.set(-π/2, 0, 0)` in `onCreated` (avoids the `lookAt` gimbal degeneracy when the view axis is parallel to `up`).
**Follow-ups:** No physics yet (M1: `<Physics>` + `Tray` + a dynamic die — rapier is installed but unused). No Zustand store yet (M3). Verified by typecheck + lint + `vite build` (295 kB gzip; the >500 kB chunk warning is expected for three + rapier — no code-split, YAGNI) and a `pnpm dev` boot (HTTP 200 on `/` + the transformed entry). A real **visual** check still needs a browser (`pnpm dev`).

### 2026-06-29 — Project docs scaffolded (planning only, no code yet)

**What:** Created the `agent_docs/` documentation system — `AGENTS.md` + `CLAUDE.md` at the root, and `agent_docs/{project_brief, architecture, physics, conventions, workflow, dev_log, roadmap}.md`. No application code yet.
**Why:** Kick off the dice prototype with the same agent-doc structure used on `point-and-click-pixin`, so future sessions have a clean map (vision / architecture / physics deep-dive / conventions / workflow / roadmap) before any code lands.
**How:** Mirrored the pixin doc set 1:1, mapping its domain deep-dive (`asset_pipeline.md`) to this project's **`physics.md`** (tray, die, settle detection, quaternion read, cocked die, fairness, throw, drag). The central invariant carried straight over: pixin's "per-frame state in plain objects, discrete state in Zustand" becomes **"per-frame physics via Rapier refs in `useFrame`, discrete state in Zustand, written once per roll"**. Locked decisions (from the brief's open questions): **Vite** (not Next), **numbers 1–6** (not pips), **tech-demo scope** (game layer deferred), **English docs**. Content seeded from the user's analysis brief; snippets flagged as "verify against the installed Rapier version" since no R3F/Rapier skill is installed.
**Follow-ups:** M0 scaffold (Vite + R3F + drei + rapier + zustand) is the next task — nothing is wired yet; the `src/` layout in `AGENTS.md` is a target, not reality.
