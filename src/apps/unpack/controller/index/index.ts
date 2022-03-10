import {
  Get,
  Post,
  Param,
  Body,
  Delete,
  Header,
  Response,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { Controller, Render } from '@/duxnest';
import { ProjectService } from 'app/unpack/service/project';

@Controller()
export class UnpackController {
  constructor(private readonly projectService: ProjectService) { }
  @Get()
  @Header('Cross-Origin-Opener-Policy', 'unsafe-none')
  @Header('Origin-Agent-Cluster', '?0')
  @Header('Content-Security-Policy', '')
  @Render('index')
  index() {
    return {};
  }
  /**
   * 项目列表
   */
  @Get('list')
  list() {
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
   * ios打包
   * @param name 项目
   */
  @Get('ios/:name')
  ios(@Param('name') name: string) {
    this.projectService.ios(name);
    return '打包命令执行成功';
  }
  /**
   * setting
   * @param name 项目
   */
  @Post('setting')
  async setting(
    @Body()
    params: {
      name: string;
      os: keyof { android; ios };
      version: string;
      code: number;
    },
  ) {
    await this.projectService.setVersion(params.name, params.os, {
      version: params.version,
      code: params.code,
    });
    return 'ok';
  }
  /**
   * 查看某个项目的打包状态
   * @param name 项目
   */
  @Get('status/:id?')
  status(@Param('name') name?: string) {
    return this.projectService.getStatus(name);
  }
  /**
   * 项目logo
   * @param name 项目
   * @param os 系统 android 或者 ios
   */
  @Get('logo/:name/:os')
  logo(
    @Response({ passthrough: true }) res,
    @Param('name') name: string,
    @Param('os') os: string,
  ) {
    const file = createReadStream(this.projectService.logo(name, os));
    res.type('image/png');
    res.headers({
      'Cross-Origin-Resource-Policy': 'sme-site',
    });
    res.send(file);
  }
}
