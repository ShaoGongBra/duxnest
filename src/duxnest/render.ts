import { Render as NestRender } from '@nestjs/common';

/**
 * 封装通过页面位置和文件名识别路由位置
 */
export const Render = (name: string) => {
  const stack = new Error().stack;
  const [, a, b, c] = stack.match(
    /[\\\/]apps[\\\/]([a-zA-z]*?)[\\\/]controller[\\\/]([a-zA-z]*?)[\\\/]([a-zA-z]*?).ts/,
  );
  if (~name.indexOf('/') || name.endsWith('.hbs')) {
    return NestRender(
      `${a}/view/${name.endsWith('.hbs') ? name : name + '.hbs'}`,
    );
  }
  return NestRender(`${a}/view/${b}/${c}/${name}.hbs`);
};
