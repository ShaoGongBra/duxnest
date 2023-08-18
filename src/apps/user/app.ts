import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entity/user'

export default {
  controllers: [],
  providers: [],
  middlewares: [],
  imports: [TypeOrmModule.forFeature([User])]
}
