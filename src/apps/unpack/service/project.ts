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
import { json } from '@/utils';
import config from '../config/project';

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
  commenExec(name: string) {
    return this.cdExec(name) + 'git pull && yarn && ';
  }
  projectExec(name: string) {
    const packageJson = json.get(join(config.rootDir, name, 'package.json'));
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
        android: { status: '' },
        ios: { status: '' },
      };
      return status[name];
    }
    return status;
  }
  android(name: string) {
    if (!this.isProject(name)) {
      throw new HttpException(name + ' 不是一个合法项目', 500);
    }
    const status = this.getStatus(name);
    if (status.android.status === 'active') {
      throw new HttpException(name + ' 正在打包', 500);
    }
    status.android.status = 'active';
    exec(`${this.commenExec(name)}${this.projectExec(name)}`, (error) => {
      if (error) {
        status.android.status = 'error';
        status.android.message = error;
      } else {
        // 上传到蒲公英
        const dir = join(
          'android',
          'app',
          'build',
          'outputs',
          'apk',
          'release',
        );
        let fileName = '';
        if (existsSync(join(config.rootDir, name, dir, 'app-release.apk'))) {
          fileName = join(dir, 'app-release.apk');
        } else if (
          existsSync(
            join(config.rootDir, name, dir, 'app-armeabi-v7a-release.apk'),
          )
        ) {
          fileName = join(dir, 'app-armeabi-v7a-release.apk');
        }
        if (!fileName) {
          status.android.status = 'error';
          status.android.message = '找不到打包后的文件';
        } else {
          exec(
            this.cdExec(name) + 'yarn duxapp rn pgyer ' + fileName,
            (error) => {
              if (error) {
                status.android.status = 'error';
                status.android.message = error;
              } else {
                status.android.status = 'complete';
                status.android.completeTime = Date.now();
              }
            },
          );
        }
      }
    });
  }
}
