import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // CRITICAL for Electron to resolve pathing inside file:// protocol
  plugins: [
    react(),
    tailwindcss(),
  ],
})
