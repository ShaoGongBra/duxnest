import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCsrf from 'fastify-csrf';
import { fastifyHelmet } from 'fastify-helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  /** 防止Csrf攻击 */
  app.register(fastifyCsrf);
  /** Helmet 设置 HTTP 标头来帮助保护你的应用免受某些众所周知的 Web 漏洞的侵害 */
  await app.register(fastifyHelmet);
  /** 开启跨域请求 */
  app.enableCors();
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
