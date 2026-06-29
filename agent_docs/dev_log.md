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
