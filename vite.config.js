import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const pages = () => {
  const root = process.cwd()
  const restartGlobs = []
  const reloadGlobs = []
  return {
    name: 'vite-plugin-duxnest-page',
    apply: 'serve',
    config(c) {
      if (!c.server) c.server = {}
      if (!c.server.watch) c.server.watch = {}
      c.server.watch.disableGlobbing = false
    },
    // configResolved(config) {},
    configureServer(server) {
      server.watcher.add([...restartGlobs, ...reloadGlobs])
      server.watcher.on('add', handleFileChange)
      server.watcher.on('change', handleFileChange)
      server.watcher.on('unlink', handleFileChange)

      function handleFileChange(file) {
        if (micromatch.isMatch(file, restartGlobs)) {
          timerState = 'restart'
          server.restart()
        } else if (micromatch.isMatch(file, reloadGlobs) && timerState !== 'restart') {
          timerState = 'reload'
          schedule(() => {
            server.ws.send({ type: 'full-reload' })
            timerState = ''
          })
        }
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'src', 'client'),
  plugins: [react(), pages()],
  publicDir: false
})
