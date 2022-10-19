import { readdirSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export const registerAppsStatic = () => {
  const apps = join(process.cwd(), 'dist', 'apps')
  return readdirSync(apps)
    .filter(item => {
      const staticDir = join(apps, item, 'static')
      return existsSync(staticDir) && statSync(staticDir).isDirectory()
    })
    .map(item => {
      return {
        rootPath: join(apps, item, 'static'),
        serveRoot: '/static/' + item,
        serveStaticOptions: {
          redirect: true
        }
      }
    })
}
