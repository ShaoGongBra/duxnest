import { MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { UnpackTestMiddleware } from './test';

const unpackMiddleware = (consumer: MiddlewareConsumer) => {
  consumer
    .apply(UnpackTestMiddleware)
    .forRoutes({ path: 'unpack/*', method: RequestMethod.ALL });
};

export default [unpackMiddleware];
