import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<any> {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const status = exception.getStatus()

    const adapter = this.httpAdapterHost.httpAdapter
    adapter.reply(response, exception.message, status)
  }
}
