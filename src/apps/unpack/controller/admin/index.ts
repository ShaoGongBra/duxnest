import { Get, Param } from '@nestjs/common';
import { Controller } from '@/duxnest';

@Controller()
export class UnpackAdminController {
  @Get(':id')
  index(@Param('id') id: string) {
    return id;
  }
  @Get('test/:id')
  test() {
    return '测试';
  }
}
