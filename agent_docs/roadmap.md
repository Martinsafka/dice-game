# Roadmap — top-down physical dice prototype

## Goal

A top-down 3D dice game where the result is **read from the physics** (which face is up after the dice settle), not from RNG. Near term: a playable **tech-demo** loop — throw → settle → read — with two procedural dice. A real game layer (score, goal) is additive and deferred.

## Principles (don't break these)

- **The physics/state boundary.** Per-frame physics via **Rapier refs in `useFrame`**; discrete state in **Zustand**, written **once per roll** at settle. Never push ~60 fps updates through React/the store.
- **Result from physics, never RNG.** The die value comes from the world quaternion (which face points up). RNG only seeds the throw.
- **Scene in `<Canvas>`, UI in DOM.** Dice/tray/lights/effects are R3F; the HUD is a DOM overlay reading Zustand.
- **Fairness.** Symmetric geometry + homogeneous mass + enough throw entropy.
- **Cocked-die safety.** Ambiguous rest (`confidence < ~0.95`) never commits a result.
- **Art is a swappable layer.** Procedural box dice now; a pretty GLB die is a later data change, not a refactor.
- **Strong types**, and the **face table ↔ material order** stay in sync.

## Sequencing

Scaffold → physical tray → **settle + read** (the core) → two dice + UI → desktop drag-throw → mobile shake → polish. The first "it reads from the simulation" moment lands at the **end of M2**.

## Working cadence

- After finishing a milestone (or a meaningful chunk), **propose the next** and **tick the checkboxes** below.
- Each task follows `workflow.md`: analyze → architecture → execute → log → commit-message → point to next.

---

### M0 — Scaffold

- [x] Vite + R3F + `@react-three/drei` + `@react-three/rapier` + Zustand project (pnpm, TS, ESLint + Prettier).
- [x] Orthographic camera looking straight down; basic lights; one **static** box rendered.
- [x] `pnpm dev` / `build` / `typecheck` / `lint` wired.
- **Goal:** something renders.

### M1 — Physical tray

- [ ] Floor + 4 fixed walls (`Tray`, see `physics.md`).
- [ ] Drop one **dynamic** die in; watch it fall, bounce, and come to rest.
- [ ] Tune `restitution`, `friction`, gravity, wall height (no pop-outs on a hard drop).

### M2 — Settle + read ⭐ the core

- [ ] `readDieValue` — value from the world quaternion (max dot with UP), with `confidence` (`physics.md`).
- [ ] `SettleWatcher` — velocity-threshold rest detection in `useFrame` (`physics.md`).
- [ ] Log the result after settle; verify by eye that the up-face matches.
- [ ] Handle the **cocked die** (`confidence < 0.95` → keep watching / nudge, never commit).
- **This is the first real "reads from the physics" moment.**

### M3 — Two dice + UI

- [ ] Zustand store (`phase`, `results`, `total`, `rolls`).
- [ ] DOM overlay: current total + roll counter + a **Roll** button → `rollDice` (random impulses).
- [ ] One store write per roll (at settle). **Now it's playable.**

### M4 — Desktop drag/throw

- [ ] Pointer raycast onto the `y = dieHeight` plane → target point.
- [ ] Velocity-based drag (`physics.md`); the throw falls out of residual velocity + a random spin.
- **Follow-up:** kinematic drag handoff for more control (synchronous kinematic→dynamic switch).

### M5 — Mobile gyro shake

- [ ] Permission gate fired from a **tap** (iOS 13+ requirement).
- [ ] Shake via `DeviceMotion` (threshold + debounce: one shake = one roll) → impulses.
- [ ] Test on a **real device over HTTPS** (Tailscale `--host`, or `vite-plugin-mkcert`).

### M6 — Polish

- [ ] Toon / cel materials + an outline (`@react-three/postprocessing`).
- [ ] Shadows (`castShadow` on dice, `receiveShadow` on the floor) for "where does it lie" readability.
- [ ] Nicer number textures / decals; a subtler tray.
- **Polish only** — never tune effects over unfinished physics.

---

## Notes

- **First aha at the end of M2** — everything before it is plumbing toward "it reads from the simulation".
- **Game layer is deferred** (tech-demo scope chosen): score, goal, win/lose, "best of N" sit on top of M3's store and can be added without touching the physics. Add it as an M3.5 / post-M6 milestone when wanted.
- **Fairness check** (optional): histogram a few hundred rolls (1–6) and tune throw entropy if the distribution skews.
- **Fixed tray now; frustum-derived later.** A tray sized to the smallest viewport dimension is the prototype unit; deriving floor/wall extents from the camera frustum on `resize` is a follow-up (M1/M3 era), not an early need.
- **Pretty dice (GLB) and pips** are deferred swaps, not refactors — the view binds to the same body.
- **Verify the Rapier API against the installed version** at every milestone — names shift between majors (no installed skill to lean on).
