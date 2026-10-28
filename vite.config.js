import { cpSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { basename, resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    vue(),
    {
      name: 'copy-static',
      apply: 'build',
      writeBundle (output) {
        cpSync('static', resolve(output.dir, 'static'), {
          recursive: true,
          filter: source => !basename(source).startsWith('.')
        })
      }
    }
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  css: {
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  server: {
    port: Number(process.env.PORT) || 8090,
    proxy: {
      '/kafkacruisecontrol': {
        target: 'http://localhost:9090',
        changeOrigin: true
      }
    }
  },
  build: {
    assetsDir: 'static',
    sourcemap: true
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
    setupFiles: ['test/setup.js'],
    restoreMocks: true
  }
})
