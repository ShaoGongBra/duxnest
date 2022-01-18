import { Get, Post, Param, Body, Delete } from '@nestjs/common';
import { Controller } from '@/utils';
import { ProjectService } from '../../service/project';

@Controller()
export class UnpackController {
  constructor(private readonly projectService: ProjectService) { }
  /**
   * 项目列表
   */
  @Get('list')
  async list() {
    return this.projectService.list();
  }
  @Delete('delete/:name')
  delete(@Param('name') name: string) {
    this.projectService.delete(name);
    return name + ' 删除成功';
  }
  /**
   * 项目列表
   */
  @Post('add')
  add(@Body() { url, name }: { url: string; name?: string }) {
    this.projectService.add(url, name);
    return '创建成功';
  }
  /**
   * 安卓打包
   * @param name 项目
   */
  @Get('android/:name')
  android(@Param('name') name: string) {
    this.projectService.android(name);
    return '打包命令执行成功';
  }
  /**
   * 查看某个项目的打包状态
   * @param name 项目
   */
  @Get('androidStatus/:id?')
  androidStatus(@Param('name') name?: string) {
    return this.projectService.getStatus(name);
  }
}
