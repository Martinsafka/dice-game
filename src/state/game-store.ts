import { create } from 'zustand'

export type Phase = 'idle' | 'rolling' | 'settled'
export type MotionStatus = 'idle' | 'enabled' | 'denied' | 'unsupported'

type GameState = {
  phase: Phase
  results: number[] // per-die values, set only at settle
  total: number
  rolls: number
  motionStatus: MotionStatus // device motion/orientation gate (shake + tilt)
  startRoll: () => void
  setResult: (values: number[]) => void
  setMotionStatus: (status: MotionStatus) => void
}

/**
 * Discrete/meta game state — the low-frequency side of the physics/state boundary
 * (agent_docs/architecture.md). Per-frame physics never touches this; phase/results are written
 * exactly twice per roll (startRoll on throw, setResult on settle). `motionStatus` is the shared
 * device-input gate: the DOM button requests permission and sets it; the in-Physics tilt controller
 * and the shake hook react to it.
 */
export const useGameStore = create<GameState>()((set) => ({
  phase: 'idle',
  results: [],
  total: 0,
  rolls: 0,
  motionStatus: 'idle',
  startRoll: () => set((s) => ({ phase: 'rolling', rolls: s.rolls + 1, results: [], total: 0 })),
  setResult: (values) =>
    set({ phase: 'settled', results: values, total: values.reduce((sum, v) => sum + v, 0) }),
  setMotionStatus: (status) => set({ motionStatus: status }),
}))
