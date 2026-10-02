import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@mejora/crm',
        replacement: path.resolve(__dirname, '../crm/src/index.ts'),
      },
      {
        find: '@mejora/contactos',
        replacement: path.resolve(__dirname, '../contactos/src/index.ts'),
      },
      {
        find: '@mejora/sm',
        replacement: path.resolve(__dirname, '../sm/src/index.ts'),
      },
      {
        find: '@mejora/nucleo',
        replacement: path.resolve(__dirname, '../../packages/nucleo/src/index.ts'),
      },
      {
        find: /^@\/(.*)/,
        replacement: '$1',
        async customResolver(source, importer, options) {
          const norm = importer ? importer.replace(/\\/g, '/') : ''
          let targetDir = path.resolve(__dirname, './src')
          if (norm.includes('apps/crm')) {
            targetDir = path.resolve(__dirname, '../crm/src')
          } else if (norm.includes('apps/contactos')) {
            targetDir = path.resolve(__dirname, '../contactos/src')
          } else if (norm.includes('apps/sm')) {
            targetDir = path.resolve(__dirname, '../sm/src')
          }
          return this.resolve(path.join(targetDir, source), importer, { skipSelf: true, ...options })
        },
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5170,
    strictPort: true,
  },
})
