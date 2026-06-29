import { create } from 'zustand'

export type Phase = 'idle' | 'rolling' | 'settled'

type GameState = {
  phase: Phase
  results: number[] // per-die values, set only at settle
  total: number
  rolls: number
  startRoll: () => void
  setResult: (values: number[]) => void
}

/**
 * Discrete/meta game state — the low-frequency side of the physics/state boundary
 * (agent_docs/architecture.md). Per-frame physics never touches this; it's written
 * exactly twice per roll: `startRoll` (on throw) and `setResult` (on settle).
 */
export const useGameStore = create<GameState>()((set) => ({
  phase: 'idle',
  results: [],
  total: 0,
  rolls: 0,
  startRoll: () => set((s) => ({ phase: 'rolling', rolls: s.rolls + 1, results: [], total: 0 })),
  setResult: (values) =>
    set({ phase: 'settled', results: values, total: values.reduce((sum, v) => sum + v, 0) }),
}))
