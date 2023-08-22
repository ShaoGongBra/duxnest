import { Get, Post, Param, Body, Delete, Header, Response } from '@nestjs/common'
import { createReadStream } from 'fs'
import { Controller } from '@/duxnest'
import { ProjectService } from 'app/unpack/service/project'

@Controller()
export class UnpackController {
  constructor(private readonly projectService: ProjectService) {}
  /**
   * 项目列表
   */
  @Post('build')
  build(@Body() { config, upload }: { config: object; upload?: object }) {
    return this.projectService.list()
  }
}
