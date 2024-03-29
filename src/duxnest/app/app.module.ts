import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ServeStaticModule } from '../static'
import { HttpExceptionFilter } from '../filter'
import { ConfigModule } from '../config'
import { DatabaseModule } from '../database'
import { registerAppsStatic } from '../static'
import { AppController } from './app.controller'
import { AppService } from './app.service'

export const modules = {
  imports: [],
  controllers: [],
  providers: [],
  middlewares: []
}

class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    modules.middlewares.forEach((reg: any): void => {
      reg(consumer)
    })
  }
}

export const appModule = () => {
  Module({
    imports: [
      ThrottlerModule.forRoot({
        ttl: 60,
        limit: 360
      }),
      ServeStaticModule.forRoot(...registerAppsStatic()),
      ConfigModule,
      DatabaseModule(),
      ...modules.imports
    ],
    controllers: [AppController, ...modules.controllers],
    providers: [
      {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter
      },
      AppService,
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard
      },
      ...modules.providers
    ]
  })(AppModule)
  return AppModule
}
