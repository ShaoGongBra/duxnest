import { Get } from '@nestjs/common';
import { Controller } from '@/duxnest';

@Controller()
export class IndexController {
  /**
   * 首页
   */
  @Get()
  async index() {
    return { message: '测试' };
  }
}
