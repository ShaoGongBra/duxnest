import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as Joi from 'joi'

export interface EnvConfig {
  [prop: string]: string | any
}

export class ConfigService {
  private readonly envConfig: EnvConfig

  constructor(filePath = `env/${process.env.NODE_ENV || 'prod'}.env`) {
    const config = dotenv.parse(fs.readFileSync(filePath))
    this.envConfig = this.validateInput(config)
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string().valid('development', 'production', 'test', 'provision').default('development'),

      PORT: Joi.number().default(8088),

      DATABASE_TYPE: Joi.string().valid('mysql').default('mysql'),

      DATABASE_HOST: Joi.string().default('localhost'),

      DATABASE_PORT: Joi.number().default(3306),

      DATABASE_USER: Joi.string().default('root'),

      DATABASE_PWD: Joi.string(),

      DATABASE_DB: Joi.string().required()
    })
    const { error, value } = envVarsSchema.validate(envConfig)
    if (error) {
      throw new Error(`配置文件验证错误: ${error.message}`)
    }
    return value
  }

  get env(): string {
    return this.envConfig.NODE_ENV
  }

  get port(): number {
    return Number(this.envConfig.PORT)
  }

  get databaseType(): keyof { mysql } {
    return this.envConfig.DATABASE_TYPE
  }

  get databaseHost(): string {
    return this.envConfig.DATABASE_HOST
  }

  get databasePort(): number {
    return Number(this.envConfig.DATABASE_PORT)
  }

  get databaseUserName(): string {
    return this.envConfig.DATABASE_USER
  }

  get databasePassword(): string {
    return this.envConfig.DATABASE_PWD
  }

  get databaseName(): string {
    return this.envConfig.DATABASE_DB
  }
}
