# Project Brief

The assignment and vision. Authoritative for **what** we're building and what's in / out of scope. For **how** it's built, see `architecture.md`; for the physics/dice specifics, see `physics.md`.

## The game

A top-down **3D dice game** played in the browser. Two physical dice sit in a small tray (a floor with four walls). The player throws them — by a button now, by drag-throw and a phone shake later — and after the dice tumble and come to rest, the game reads the result from **where they actually landed**: the face pointing up on each die.

The camera looks **straight down** (orthographic), so "which face is up" is visually unambiguous and there's no perspective distortion at the edges.

## The core idea (the whole point)

**The result is read from the physics, not from a random number generator.** After the dice settle, each die's value is computed from its **world rotation** — rotate every face's local normal into world space, find the one pointing most "up". `Math.random()` is used **only** to seed the throw (the impulse and spin that give the tumble its entropy); it never decides the outcome. A fair _physical_ die is the feature.

This is the first real "aha — it's reading from the simulation" moment, and it arrives at the end of **M2** (see `roadmap.md`).

## Visual direction

Clean and readable over fancy. Pure top-down ortho view; a small tray that reads clearly; shadows so you can tell where a die lies. Dice are a **procedural box with number faces 1–6** (a digit drawn onto a coloured square via `CanvasTexture`) — no asset pipeline. Toon shading + an outline + nicer materials are a **final polish layer** (M6), added only once the physics is solid.

## Core loop (tech-demo scope)

- **Throw** — apply a random impulse + spin to each die (button now; drag-throw and phone-shake later).
- **Settle** — the physics runs; a watcher detects when both dice are at rest.
- **Read** — quaternion → which face is up → `[d1, d2]` + total → written **once** to Zustand → the UI updates.
- **Repeat.**

## Scope (prototype reality)

**In:**

- Vite + R3F + Rapier + drei + Zustand client app.
- An orthographic top-down tray: floor + 4 fixed walls.
- **Two** procedural box dice with number faces **1–6**.
- Settle detection + read-from-physics + **cocked-die** handling.
- A minimal **DOM** UI: the current total, a **Roll** button, a roll counter.
- Desktop **drag-throw**; mobile **gyro-shake** (HTTPS + the iOS permission gate).
- Toon / outline / shadow **polish** at the end.

**Out / deferred / at risk:**

- **A real game layer** (score, goal, win/lose, "best of N") — additive on top of the demo; deliberately deferred (tech-demo scope chosen). The loop must be complete and demonstrable without it.
- **Pretty dice** — rounded edges, engraved pips, a Blender → GLB model with Draco/KTX2. The procedural box is enough to prove the systems; the nice die is a later **swap**, not a refactor.
- **Pips** instead of numbers — numbers chosen for the prototype (simplest texture).
- Tilt-to-roll (`DeviceOrientation` → gravity), multiplayer, persistence, sound.

**Hard limits:** two dice · numbers 1–6 · one tray · the result is **always** read from physics (never RNG).

## Bonus (stretch only)

Mobile **tilt** (map `DeviceOrientation` beta/gamma to gravity so the dice roll as you tilt the phone), nicer **GLB** dice, and a **game frame** (score / goal / "roll again"). **The prototype must be complete and demonstrable without any of these** — build them last, behind the working demo.

## Why these decisions (short)

- **Vite over Next.js:** a client-only WebGL toy; Three touches `window`/WebGL, so SSR is pure friction (`ReferenceError: window is not defined` at build). Vite is the first-class Three path and matches the team's toolchain.
- **Read from physics over RNG:** it _is_ the project. A fair physical die you can watch tumble is the whole reason to build this in 3D instead of `Math.random()` + a sprite.
- **Numbers over pips:** the simplest `CanvasTexture` (a digit on a square), no asset work; pips are a later texture swap.
- **Tech demo before a game:** smallest path to the "it reads from the simulation" moment (end of M2). The game layer is additive and can't de-risk the core, so it waits.
- **Procedural box over a GLB model:** placeholder dice prove the **systems**; swapping in a pretty die is a data change, not a rewrite.
