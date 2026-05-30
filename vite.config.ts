import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Относительные пути к ассетам — нужно для запуска через file:// в Electron
  base: './',
  plugins: [react(), tailwindcss()],
})
