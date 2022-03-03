import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class UnpackTestMiddleware implements NestMiddleware {
  use(req, res, next) {
    console.log(req.originalUrl);
    next();
  }
}
