import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import chokidar from 'chokidar'
import { resolve, sep } from 'path'
import { writeFileSync } from 'fs'

const pages = () => {
  // 当前是开发模式还是调试模式
  let mode = 'development'
  // 监听程序是否加载完成
  let ready = false
  const createRouter = watcher => {
    if (!ready) {
      return
    }
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
        const pageName = item.map(key => key.charAt(0).toUpperCase() + key.slice(1)).join('')
        const pagePath = `'../../apps/${item[0]}/view/${item[1]}/${item[2]}/${item[3]}'`

        const routePath = item
          .reduceRight((prev, current) => {
            if (prev.length || current !== 'index') {
              prev.unshift(current)
            }
            return prev
          }, [])
          .join('/')
        return [
          mode === 'development'
            ? `import ${pageName} from ${pagePath}`
            : `const ${pageName} = lazy(() => import(${pagePath}))`,
          `'/${routePath}': ${pageName}`
        ]
      })
    const template = `import { lazy } from 'react'

${list.map(v => v[0]).join('\n')}

export const routeList = {
  ${list.map(v => v[1]).join(',\n  ')}
}
`
    // console.log('监听', template)
    writeFileSync('./src/client/route/RouteList.jsx', template, { encoding: 'utf8' })
  }
  return {
    name: 'vite-plugin-duxnest-page',
    apply: 'serve',
    config(config, env) {
      mode = env.mode
    },
    buildStart() {
      const watcher = chokidar.watch('./src/apps/*/view/*/*/*.jsx', {
        ignored: [],
        persistent: true
      })
      watcher.on('ready', () => {
        ready = true
        createRouter(watcher)
      })
      watcher.on('add', file => {
        console.log('add', file)
        createRouter(watcher)
      })
      watcher.on('unlink', file => {
        console.log('unlink', file)
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
