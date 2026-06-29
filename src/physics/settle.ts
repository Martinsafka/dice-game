// Settle-detection tuning. Kept in one place so the watcher reads, not hardcodes, them.

/** A die is "calm" when its linear AND angular speed² are both under these. */
export const CALM_LINEAR_SQ = 1e-3
export const CALM_ANGULAR_SQ = 1e-3

/** Consecutive calm frames required before reading (≈ 0.2 s at 60 fps). */
export const SETTLE_FRAMES = 12

/** Below this read confidence the die is cocked (leaning) — never report it. */
export const COCKED_CONFIDENCE = 0.95
