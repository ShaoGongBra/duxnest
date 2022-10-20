import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import chokidar from 'chokidar'
import { resolve, sep } from 'path'
import { writeFileSync } from 'fs'

const pages = () => {
  const createRouter = watcher => {
    const watched = watcher.getWatched()
    const list = Object.keys(watched)
      .filter(key => watched[key].some(v => v.endsWith('.jsx')))
      .map(key =>
        watched[key].map(v => {
          let paths = key.split(sep)
          paths = [...paths.slice(paths.length - 4), v.replace('.jsx', '')]
          paths.splice(1, 1)
          return paths
        })
      )
      .flat()
      .map(item => {
        const name = item.map(key => key.charAt(0).toUpperCase() + key.slice(1)).join('')
        return [
          `import ${name} from '../../apps/${item[0]}/view/${item[1]}/${item[2]}/${item[3]}'`,
          `'${item.join('/')}': ${name}`
        ]
      })
    const template = `${list.map(v => v[0]).join('\n')}

export const routerList = {
  ${list.map(v => v[1]).join(',\n  ')}
}
`
    // console.log('监听', template)
    writeFileSync('./src/client/router/RouterList.jsx', template, { encoding: 'utf8' })
  }
  return {
    name: 'vite-plugin-duxnest-page',
    apply: 'serve',
    buildStart() {
      const watcher = chokidar.watch('./src/apps/*/view/*/*/*.jsx', {
        ignored: [],
        persistent: true
      })
      watcher.on('add', () => {
        // console.log('add', file)
        createRouter(watcher)
      })
      watcher.on('unlink', () => {
        // console.log('unlink', file)
        createRouter(watcher)
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'src', 'client'),
  plugins: [react(), pages()],
  publicDir: false
})
