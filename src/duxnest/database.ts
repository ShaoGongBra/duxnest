import { DynamicModule } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { resolve } from 'path'
import { ConfigService } from './config/config.service'

export const DatabaseModule = (): DynamicModule => {
  const config = new ConfigService()
  const edtityPath = resolve(process.cwd(), `dist/apps/**/entity/*{.ts,.js}`)

  return TypeOrmModule.forRoot({
    type: config.databaseType,
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUserName,
    password: config.databasePassword,
    database: config.databaseName,
    entities: [edtityPath],
    subscribers: [edtityPath],
    synchronize: true,
    dropSchema: false
  })
}
