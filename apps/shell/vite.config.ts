import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mejora/crm': path.resolve(__dirname, '../crm/src/index.ts'),
      '@mejora/contactos': path.resolve(__dirname, '../contactos/src/index.ts'),
      '@mejora/nucleo': path.resolve(__dirname, '../../packages/nucleo/src/index.ts'),
    },
  },
  server: {
    port: 5170,
  },
})
