import { Injectable, HttpException } from '@nestjs/common'
import { readdirSync, writeFileSync, statSync, existsSync, rmdirSync, unlinkSync, readFileSync } from 'fs'
import { execSync, exec } from 'child_process'
import { join } from 'path'
import config from '../config/project'

const OS = {
  android: 'android',
  ios: 'ios'
}

const dateToStr = (formatStr = 'yyyy-MM-dd HH:mm:ss', date: Date = new Date()) => {
  let str = formatStr
  const Week = ['日', '一', '二', '三', '四', '五', '六']
  str = str.replace(/yyyy|YYYY/, '' + date.getFullYear())
  str = str.replace(
    /yy|YY/,
    date.getFullYear() % 100 > 9 ? (date.getFullYear() % 100).toString() : '0' + (date.getFullYear() % 100)
  )
  str = str.replace(/MM/, date.getMonth() > 8 ? '' + date.getMonth() + 1 : '0' + (date.getMonth() + 1))
  str = str.replace(/M/g, '' + date.getMonth() + 1)
  str = str.replace(/w|W/g, Week[date.getDay()])

  str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate())
  str = str.replace(/d|D/g, '' + date.getDate())

  str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : '0' + date.getHours())
  str = str.replace(/h|H/g, '' + date.getHours())
  str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes())
  str = str.replace(/m/g, '' + date.getMinutes())

  str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds())
  str = str.replace(/s|S/g, '' + date.getSeconds())

  return str
}

@Injectable()
export class ProjectService {
  /**
   * 判断是不是有效的项目
   * @param name 项目名称
   */
  isProject(name: string): boolean {
    const dir = join(config.rootDir, name)
    return existsSync(dir) && statSync(dir).isDirectory() && existsSync(join(dir, 'duxapp.config.js'))
  }
  getVersion(name: string) {
    const buildGradle = readFileSync(join(config.rootDir, name, 'android', 'app', 'build.gradle'), { encoding: 'utf8' })
    const xcodeproj = readFileSync(join(config.rootDir, name, 'ios', 'duxapp.xcodeproj', 'project.pbxproj'), {
      encoding: 'utf8'
    })
    return {
      android: {
        code: +buildGradle.match(/versionCode (\d{1,})/)[1],
        name: buildGradle.match(/versionName "([\d.]{1,})"/)[1]
      },
      ios: {
        code: +xcodeproj.match(/CURRENT_PROJECT_VERSION = (\d{1,});/)[1],
        name: xcodeproj.match(/MARKETING_VERSION = ([\d.]{1,});/)[1]
      }
    }
  }
  async setVersion(
    name: string,
    os: string,
    setting: {
      version: string
      code: number
    }
  ) {
    if (os === OS.android) {
      const file = join(config.rootDir, name, 'android', 'app', 'build.gradle')
      const buildGradle = readFileSync(file, { encoding: 'utf8' })
      writeFileSync(
        file,
        buildGradle
          .replace(/versionCode \d{1,}/, `versionCode ${setting.code}`)
          .replace(/versionName "[\d.]{1,}"/, `versionName "${setting.version}"`),
        {
          encoding: 'utf-8'
        }
      )
      await this.exec(`${this.cdExec(name)}git add . && git commit -m "android version update" && git push`)
    } else {
      const file = join(config.rootDir, name, 'ios', 'duxapp.xcodeproj', 'project.pbxproj')
      const xcodeproj = readFileSync(file, { encoding: 'utf8' })
      writeFileSync(
        file,
        xcodeproj
          .replace(/CURRENT_PROJECT_VERSION = \d{1,};/g, `CURRENT_PROJECT_VERSION = ${setting.code};`)
          .replace(/MARKETING_VERSION = [\d.]{1,};/g, `MARKETING_VERSION = ${setting.version};`),
        {
          encoding: 'utf-8'
        }
      )
      await this.exec(`${this.cdExec(name)}git add . && git commit -m "ios version update" && git push`)
    }
  }
  list() {
    return readdirSync(config.rootDir)
      .filter(item => this.isProject(item))
      .map(name => {
        const packageJson = JSON.parse(
          readFileSync(join(config.rootDir, name, 'package.json'), {
            encoding: 'utf8'
          })
        )
        return {
          name,
          description: packageJson.description,
          status: this.getStatus(name),
          version: this.getVersion(name)
        }
      })
  }
  /**
   * 创建项目
   * @param url 仓库地址
   * @param name 仓库名称默认采用git名称
   */
  add(url: string, name?: string): void {
    if (!name) {
      const namearr = url.split('/')
      name = namearr[namearr.length - 1].split('.')[0]
    }
    if (existsSync(join(config.rootDir, name))) {
      throw new HttpException(name + ' 已存在', 500)
    }
    execSync(`git clone ${url} ${join(config.rootDir, name)}`)
  }
  delete(name: string) {
    if (!this.isProject(name)) {
      throw new HttpException(name + ' 不是一个合法项目', 500)
    }
    const deleteFunc = (path: string) => {
      if (existsSync(path)) {
        if (statSync(path).isDirectory()) {
          const files = readdirSync(path)
          files.forEach(file => {
            const currentPath = path + '/' + file
            if (statSync(currentPath).isDirectory()) {
              deleteFunc(currentPath)
            } else {
              unlinkSync(currentPath)
            }
          })
          rmdirSync(path)
        } else {
          unlinkSync(path)
        }
      }
    }
    deleteFunc(join(config.rootDir, name))
  }
  cdExec(name: string) {
    const dir = 'cd ' + join(config.rootDir, name) + ' && '
    return /^[A-Z]{1,}:/.test(config.rootDir) ? config.rootDir.split(':')[0] + ': && ' + dir : dir
  }
  projectExec(name: string) {
    const packageJson = JSON.parse(
      readFileSync(join(config.rootDir, name, 'package.json'), {
        encoding: 'utf8'
      })
    )
    // 判断项目类型 执行不同的命令
    if (packageJson.dependencies['@tarojs/taro'].startsWith('2.')) {
      return `yarn build:rn && cd android && gradlew assembleRelease`
    } else {
      return `yarn build:rn && yarn build:android`
    }
  }
  getStatus(name?: string) {
    const status = (global.unpackStatus = global.unpackStatus || {})
    if (name) {
      status[name] = status[name] || {
        android: { status: '', log: [] },
        ios: { status: '', log: [] }
      }
      return status[name]
    }
    return status
  }
  log(log = '') {
    return dateToStr() + ': ' + log
  }
  clearLog(name: string, os: string) {
    const status = this.getStatus(name)
    status[os].log = []
  }
  startActive(name: string, os: string, log = '') {
    const status = this.getStatus(name)
    if (status[os].status === 'active') {
      throw new HttpException(name + ' 正在打包', 500)
    }
    status[os].status = 'active'
    if (log) {
      status[os].log.push(this.log(log))
    }
  }
  endActive(name: string, os: string, log = '') {
    const status = this.getStatus(name)
    status[os].status = 'complete'
    if (log) {
      status[os].log.push(this.log(log))
    }
  }
  errorActive(name: string, os: string, err: any) {
    const status = this.getStatus(name)
    status[os].status = 'error'
    status[os].log.push(this.log(err?.message || err))
    status[os].message = 'build error'
  }
  exec(...cmds: string[]) {
    return new Promise((resolve, reject) => {
      const callback = (prevInfo = '') => {
        if (!cmds.length) {
          resolve(prevInfo)
          return
        }
        const item = cmds.shift()
        exec(item, (error, info) => {
          if (error) {
            reject(error)
          } else {
            callback(info)
          }
        })
      }
      callback()
    })
  }
  async base(name: string, os: string) {
    this.startActive(name, os, '开始代码同步')
    await this.exec(this.cdExec(name) + 'git pull && yarn')
    this.endActive(name, os)
  }
  async podInstall(name: string, os: string) {
    this.startActive(name, os, '开始 pod install')
    await this.exec(this.cdExec(name) + 'yarn pod-install')
    this.endActive(name, os)
  }
  async buildCode(name: string, os: string) {
    this.startActive(name, os, '开始编译项目')
    await this.exec(`${this.cdExec(name)}yarn build:rn-${os}`)
    this.endActive(name, os)
  }
  async build(name: string, os: string) {
    const packageJson = JSON.parse(
      readFileSync(join(config.rootDir, name, 'package.json'), {
        encoding: 'utf8'
      })
    )
    let buildExec: string
    // 判断项目类型 执行不同的命令
    if (packageJson.dependencies['@tarojs/taro'].startsWith('2.')) {
      buildExec = `cd android && gradlew assembleRelease`
    } else {
      buildExec = `yarn build:${os}${os === OS.ios ? ' && yarn export:ios' : ''}`
    }
    this.startActive(name, os, '开始打包安装包')
    await this.exec(`${this.cdExec(name)}${buildExec}`)
    this.endActive(name, os)
  }
  async codepush(name: string, os: string) {
    this.startActive(name, os, '开始上传热更新代码')
    try {
      await this.exec(`${this.cdExec(name)}yarn codepush:${os}`)
    } catch (error) {
      if (
        !~error?.message.indexOf(
          "The uploaded package was not released because it is identical to the contents of the specified deployment's current release"
        )
      ) {
        throw error
      }
    }
    this.endActive(name, os)
  }
  async prger(name: string, os: string) {
    this.startActive(name, os, '开始上传蒲公英')
    // 上传到蒲公英
    const dir = join('android', 'app', 'build', 'outputs', 'apk', 'release')
    let fileName = ''
    if (existsSync(join(config.rootDir, name, dir, 'app-release.apk'))) {
      fileName = join(dir, 'app-release.apk')
    } else if (existsSync(join(config.rootDir, name, dir, 'app-armeabi-v7a-release.apk'))) {
      fileName = join(dir, 'app-armeabi-v7a-release.apk')
    }
    if (!fileName) {
      throw '找不到打包后的文件'
    }
    await this.exec(this.cdExec(name) + 'yarn duxapp rn pgyer ' + fileName)
    this.endActive(name, os)
  }
  async upload(name: string, os: string) {
    this.startActive(name, os, '开始上传AppStore')
    await this.exec(this.cdExec(name) + 'yarn upload-ios')
    this.endActive(name, os)
  }
  async android(name: string) {
    try {
      this.clearLog(name, OS.android)
      await this.base(name, OS.android)
      await this.buildCode(name, OS.android)
      await this.codepush(name, OS.android)
      await this.build(name, OS.android)
      await this.prger(name, OS.android)
      this.endActive(name, OS.android, '打包完成 已上传至蒲公英')
    } catch (error) {
      this.errorActive(name, OS.android, error)
    }
  }
  async ios(name: string) {
    try {
      this.clearLog(name, OS.ios)
      await this.base(name, OS.ios)
      await this.podInstall(name, OS.ios)
      await this.buildCode(name, OS.ios)
      await this.codepush(name, OS.ios)
      await this.build(name, OS.ios)
      await this.upload(name, OS.ios)
      this.endActive(name, OS.ios, '打包完成 已上传至应用商店')
    } catch (error) {
      this.errorActive(name, OS.ios, error)
    }
  }
  logo(name: string, os: string) {
    if (os === OS.android) {
      return join(config.rootDir, name, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png')
    } else {
      return join(config.rootDir, name, 'ios', 'duxapp', 'Images.xcassets', 'AppIcon.appiconset', 'icon-40@2x.png')
    }
  }
}
