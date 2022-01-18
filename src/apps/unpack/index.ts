import { UnpackController } from './controller/index/index';
import { UnpackAdminController } from './controller/admin/index';

import { ProjectService } from './service/project';

export default {
  controllers: [UnpackAdminController, UnpackController],
  services: [ProjectService],
};
