import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standaard Vite + React config. Draait out-of-the-box op Vercel.
export default defineConfig({
  plugins: [react()],
})
