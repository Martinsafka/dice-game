import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project GitHub Pages serves at https://<user>.github.io/<repo>/, so the production build needs
// base = '/<repo>/'. Change REPO if the repository name differs. Dev stays at '/'.
const REPO = 'dice-game'

// build.target 'esnext' is required: @react-three/rapier ships @dimforge/rapier3d-compat, which
// uses top-level await — Vite's production build rejects TLA under the default target. Dev is fine.
// See agent_docs/dev_log.md. https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO}/` : '/',
  plugins: [react()],
  build: {
    target: 'esnext',
  },
}))
