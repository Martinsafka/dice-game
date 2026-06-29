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
> **What:** Added `src/physics/read-die.ts`, `src/scene/SettleWatcher.tsx`; logs `[d1, d2]` after the dice rest.
> **Why:** M2 — prove the result is read from the simulation, not RNG.
> **How:** Velocity-threshold settle in `useFrame` (12 calm frames); value from the world quaternion (max dot with UP). Cocked dice (`confidence < 0.95`) are not committed. Preallocated `_q`/`_n` to avoid per-frame GC.
> **Follow-ups:** Cocked-die nudge not wired yet (currently just keeps watching).

---

<!-- Newest entries below. Add yours on top of the list. -->

### 2026-06-29 — Project docs scaffolded (planning only, no code yet)
**What:** Created the `agent_docs/` documentation system — `AGENTS.md` + `CLAUDE.md` at the root, and `agent_docs/{project_brief, architecture, physics, conventions, workflow, dev_log, roadmap}.md`. No application code yet.
**Why:** Kick off the dice prototype with the same agent-doc structure used on `point-and-click-pixin`, so future sessions have a clean map (vision / architecture / physics deep-dive / conventions / workflow / roadmap) before any code lands.
**How:** Mirrored the pixin doc set 1:1, mapping its domain deep-dive (`asset_pipeline.md`) to this project's **`physics.md`** (tray, die, settle detection, quaternion read, cocked die, fairness, throw, drag). The central invariant carried straight over: pixin's "per-frame state in plain objects, discrete state in Zustand" becomes **"per-frame physics via Rapier refs in `useFrame`, discrete state in Zustand, written once per roll"**. Locked decisions (from the brief's open questions): **Vite** (not Next), **numbers 1–6** (not pips), **tech-demo scope** (game layer deferred), **English docs**. Content seeded from the user's analysis brief; snippets flagged as "verify against the installed Rapier version" since no R3F/Rapier skill is installed.
**Follow-ups:** M0 scaffold (Vite + R3F + drei + rapier + zustand) is the next task — nothing is wired yet; the `src/` layout in `AGENTS.md` is a target, not reality.
