import { TypeOrmModule } from '@nestjs/typeorm'

import { UnpackController } from './controller/index/index'
import { UnpackAdminController } from './controller/admin/index'

import { ProjectService } from './service/project'

import { UnpackConfig } from './entity/config'

import middlewares from './middleware'

export default {
  controllers: [UnpackAdminController, UnpackController],
  providers: [ProjectService],
  middlewares,
  imports: [TypeOrmModule.forFeature([UnpackConfig])],
}
