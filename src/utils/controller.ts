import { Controller as NestController } from '@nestjs/common';

/**
 * 封装通过页面位置和文件名识别路由位置
 */
export const Controller = () => {
  const stack = new Error().stack;
  const [, a, b, c] = stack.match(
    /[\\\/]apps[\\\/]([a-zA-z]*?)[\\\/]controller[\\\/]([a-zA-z]*?)[\\\/]([a-zA-z]*?).ts/,
  );
  const path = [b, a, c].filter((item) => item !== 'index').join('/');
  return NestController(path);
};
