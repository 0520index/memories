import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const root = import.meta.dirname

function versionPlugin(): Plugin {
  const version = Date.now().toString(36)
  return {
    name: 'app-version',
    config() {
      return {
        define: {
          __APP_VERSION__: JSON.stringify(version),
        },
      }
    },
    buildStart() {
      // 開発中も /version.json を読めるように public に書く
      writeFileSync(resolve(root, 'public/version.json'), JSON.stringify({ version }) + '\n')
    },
    closeBundle() {
      writeFileSync(resolve(root, 'dist/version.json'), JSON.stringify({ version }) + '\n')
    },
  }
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
})
