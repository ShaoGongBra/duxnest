import { VersioningType, VERSION_NEUTRAL } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from 'fastify-cookie';
import fastifyCsrf from 'fastify-csrf';
import fastifyHelmet from '@fastify/helmet';
import { join } from 'path';
import { appModule, modules } from './app.module';

export const duxNestRun = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    appModule(),
    new FastifyAdapter(),
  );
  /** Cookie */
  app.register(fastifyCookie);
  /** 防止Csrf攻击 */
  app.register(fastifyCsrf);
  /** Helmet 设置 HTTP 标头来帮助保护你的应用免受某些众所周知的 Web 漏洞的侵害 */
  await app.register(fastifyHelmet);
  /** 开启跨域请求 */
  app.enableCors();
  /** api版本控制 */
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'Api-Version',
    defaultVersion: VERSION_NEUTRAL,
  });
  /** 模板引擎 */
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(process.cwd(), 'dist', 'apps'),
  });
  await app.listen(3000, '0.0.0.0');
};

export const duxNestAppInstall = (...org: object[]) => {
  org.forEach((option) => {
    Object.keys(option).forEach((key: string) => {
      modules[key].push(...option[key]);
    });
  });
};
