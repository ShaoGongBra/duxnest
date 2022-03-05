import { Injectable, HttpException } from '@nestjs/common';
import {
  readdirSync,
  statSync,
  existsSync,
  rmdirSync,
  unlinkSync,
  readFileSync,
} from 'fs';
import { execSync, exec } from 'child_process';
import { join } from 'path';
import config from '../config/project';

const OS = {
  android: 'android',
  ios: 'ios',
};

@Injectable()
export class ProjectService {
  /**
   * 判断是不是有效的项目
   * @param name 项目名称
   */
  isProject(name: string): boolean {
    const dir = join(config.rootDir, name);
    return (
      existsSync(dir) &&
      statSync(dir).isDirectory() &&
      existsSync(join(dir, 'duxapp.config.js'))
    );
  }
  getVersion(name: string) {
    const buildGradle = readFileSync(
      join(config.rootDir, name, 'android', 'app', 'build.gradle'),
      { encoding: 'utf8' },
    );
    return {
      android: {
        code: +buildGradle.match(/versionCode (\d{1,})/)[1],
        name: buildGradle.match(/versionName "([\d.]{1,})"/)[1],
      },
      ios: {
        code: 1,
        name: '1.0.0',
      },
    };
  }
  list() {
    return readdirSync(config.rootDir)
      .filter((item) => this.isProject(item))
      .map((name) => {
        return {
          name,
          status: this.getStatus(name),
          version: this.getVersion(name),
        };
      });
  }
  /**
   * 创建项目
   * @param url 仓库地址
   * @param name 仓库名称默认采用git名称
   */
  add(url: string, name?: string): void {
    if (!name) {
      const namearr = url.split('/');
      name = namearr[namearr.length - 1].split('.')[0];
    }
    if (existsSync(join(config.rootDir, name))) {
      throw new HttpException(name + ' 已存在', 500);
    }
    execSync(`git clone ${url} ${join(config.rootDir, name)}`);
  }
  delete(name: string) {
    if (!this.isProject(name)) {
      throw new HttpException(name + ' 不是一个合法项目', 500);
    }
    const deleteFunc = (path: string) => {
      if (existsSync(path)) {
        if (statSync(path).isDirectory()) {
          const files = readdirSync(path);
          files.forEach((file) => {
            const currentPath = path + '/' + file;
            if (statSync(currentPath).isDirectory()) {
              deleteFunc(currentPath);
            } else {
              unlinkSync(currentPath);
            }
          });
          rmdirSync(path);
        } else {
          unlinkSync(path);
        }
      }
    };
    deleteFunc(join(config.rootDir, name));
  }
  cdExec(name: string) {
    const dir = 'cd ' + join(config.rootDir, name) + ' && ';
    return /^[A-Z]{1,}:/.test(config.rootDir)
      ? config.rootDir.split(':')[0] + ': && ' + dir
      : dir;
  }
  projectExec(name: string) {
    const packageJson = JSON.parse(
      readFileSync(join(config.rootDir, name, 'package.json'), {
        encoding: 'utf8',
      }),
    );
    // 判断项目类型 执行不同的命令
    if (packageJson.dependencies['@tarojs/taro'].startsWith('2.')) {
      return `yarn build:rn && cd android && gradlew assembleRelease`;
    } else {
      return `yarn build:rn && yarn build:android`;
    }
  }
  getStatus(name?: string) {
    const status = (global.unpackStatus = global.unpackStatus || {});
    if (name) {
      status[name] = status[name] || {
        android: { status: '', log: [] },
        ios: { status: '', log: [] },
      };
      return status[name];
    }
    return status;
  }
  log(log = '') {
    return Date.now() + ': ' + log;
  }
  startActive(name: string, os: string, log = '') {
    const status = this.getStatus(name);
    if (status[os].status === 'active') {
      throw new HttpException(name + ' 正在打包', 500);
    }
    status[os].status = 'active';
    if (log) {
      status[os].log.push(this.log(log));
    }
  }
  endActive(name: string, os: string, log = '') {
    const status = this.getStatus(name);
    status[os].status = 'complete';
    if (log) {
      status[os].log.push(this.log(log));
    }
  }
  errorActive(name: string, os: string, err: any) {
    const status = this.getStatus(name);
    status[os].status = 'error';
    status[os].message = err?.message || err;
  }
  exec(...cmds: string[]) {
    return new Promise((resolve, reject) => {
      const callback = (prevInfo = '') => {
        if (!cmds.length) {
          resolve(prevInfo);
          return;
        }
        const item = cmds.shift();
        exec(item, (error, info) => {
          if (error) {
            reject(error);
          } else {
            callback(info);
          }
        });
      };
      callback();
    });
  }
  async base(name: string, os: string) {
    this.startActive(name, os, '开始代码同步');
    await this.exec(this.cdExec(name) + 'git pull && yarn');
    this.endActive(name, os);
  }
  async buildCode(name: string, os: string) {
    this.startActive(name, os, '开始编译项目');
    await this.exec(`${this.cdExec(name)}yarn build:rn-${os}`);
    this.endActive(name, os);
  }
  async build(name: string, os: string) {
    const packageJson = JSON.parse(
      readFileSync(join(config.rootDir, name, 'package.json'), {
        encoding: 'utf8',
      }),
    );
    let buildExec: string;
    // 判断项目类型 执行不同的命令
    if (packageJson.dependencies['@tarojs/taro'].startsWith('2.')) {
      buildExec = `cd android && gradlew assembleRelease`;
    } else {
      buildExec = `yarn build:${os}${
        os === OS.ios ? ' && yarn export:ios' : ''
      }`;
    }
    this.startActive(name, os, '开始打包安装包');
    await this.exec(`${this.cdExec(name)}${buildExec}`);
    this.endActive(name, os);
  }
  async codepush(name: string, os: string) {
    this.startActive(name, os, '开始上传热更新代码');
    await this.exec(`${this.cdExec(name)}yarn codepush:${os}`);
    this.endActive(name, os);
  }
  async prger(name: string, os: string) {
    this.startActive(name, os, '开始上传蒲公英');
    // 上传到蒲公英
    const dir = join('android', 'app', 'build', 'outputs', 'apk', 'release');
    let fileName = '';
    if (existsSync(join(config.rootDir, name, dir, 'app-release.apk'))) {
      fileName = join(dir, 'app-release.apk');
    } else if (
      existsSync(join(config.rootDir, name, dir, 'app-armeabi-v7a-release.apk'))
    ) {
      fileName = join(dir, 'app-armeabi-v7a-release.apk');
    }
    if (!fileName) {
      throw '找不到打包后的文件';
    }
    await this.exec(this.cdExec(name) + 'yarn duxapp rn pgyer ' + fileName);
    this.endActive(name, os);
  }
  async upload(name: string, os: string) {
    this.startActive(name, os, '开始上传蒲公英');
    await this.exec(this.cdExec(name) + 'yarn upload-ios');
    this.endActive(name, os);
  }
  async android(name: string) {
    try {
      await this.base(name, OS.android);
      await this.buildCode(name, OS.android);
      await this.codepush(name, OS.android);
      await this.build(name, OS.android);
      await this.prger(name, OS.android);
      this.endActive(name, OS.android, '打包完成 已上传至蒲公英');
    } catch (error) {
      this.errorActive(name, OS.android, error);
    }
  }
  async ios(name: string) {
    try {
      await this.base(name, OS.ios);
      await this.buildCode(name, OS.ios);
      await this.codepush(name, OS.ios);
      await this.build(name, OS.ios);
      await this.upload(name, OS.ios);
      this.endActive(name, OS.ios, '打包完成 已上传至应用商店');
    } catch (error) {
      this.errorActive(name, OS.ios, error);
    }
  }
}
