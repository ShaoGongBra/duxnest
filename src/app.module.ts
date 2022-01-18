import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { controllers, services } from './apps';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 360,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      serveStaticOptions: {
        redirect: false,
      },
    }),
  ],
  controllers: [AppController, ...controllers],
  providers: [
    AppService,
    ...services,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
