import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HttpExceptionFilter } from '../filter';
import { ConfigModule } from '../config';
import { DatabaseModule } from '../database';
import { AppController } from './app.controller';
import { AppService } from './app.service';

export const modules = {
  imports: [],
  controllers: [],
  providers: [],
  middlewares: [],
};

class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    modules.middlewares.forEach((reg: any): void => {
      reg(consumer);
    });
  }
}

export const appModule = () => {
  Module({
    imports: [
      ThrottlerModule.forRoot({
        ttl: 60,
        limit: 360,
      }),
      ServeStaticModule.forRoot({
        rootPath: join(process.cwd(), 'dist/apps/unpack/static'),
        serveRoot: 'unpack/static',
        serveStaticOptions: {
          redirect: false,
        },
      }),
      ServeStaticModule.forRoot({
        rootPath: join(process.cwd(), 'dist/apps/index/static'),
        serveRoot: 'index/static',
        serveStaticOptions: {
          redirect: false,
        },
      }),
      ConfigModule,
      DatabaseModule(),
      ...modules.imports,
    ],
    controllers: [AppController, ...modules.controllers],
    providers: [
      {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
      },
      AppService,
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
      ...modules.providers,
    ],
  })(AppModule);
  return AppModule;
};
