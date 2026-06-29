import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// build.target 'esnext' is required: @react-three/rapier ships @dimforge/rapier3d-compat,
// which uses top-level await. Vite's production build rejects TLA under the default target
// (the "Vite top-level-await gotcha"). Dev is fine; only the prod output target needs this.
// See agent_docs/dev_log.md. https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
  },
})
