import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const pages = () => {
  const root = process.cwd()
  return {
    name: `vite-plugin-duxnest-page:${i++}`,
    apply: 'serve',
    config(c) {
      if (!c.server)
        c.server = {}
      if (!c.server.watch)
        c.server.watch = {}
      c.server.watch.disableGlobbing = false
    },
    configResolved(config) {
      // famous last words, but this *appears* to always be an absolute path
      // with all slashes normalized to forward slashes `/`. this is compatible
      // with path.posix.join, so we can use it to make an absolute path glob
      root = config.root

      restartGlobs = toArray(options.restart).map(i => path.posix.join(root, i))
      reloadGlobs = toArray(options.reload).map(i => path.posix.join(root, i))
    },
    configureServer(server) {
      server.watcher.add([
        ...restartGlobs,
        ...reloadGlobs,
      ])
      server.watcher.on('add', handleFileChange)
      server.watcher.on('change', handleFileChange)
      server.watcher.on('unlink', handleFileChange)

      function handleFileChange(file) {
        if (micromatch.isMatch(file, restartGlobs)) {
          timerState = 'restart'
          server.restart()
        }
        else if (micromatch.isMatch(file, reloadGlobs) && timerState !== 'restart') {
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
