import { readFileSync, writeFileSync } from 'fs';

export const json = {
  get(filename: string): any {
    const data = readFileSync(filename, { encoding: 'utf8' });
    return JSON.parse(data);
  },
  set(filename: string, content: object): void {
    writeFileSync(filename, JSON.stringify(content, null, 2), {
      encoding: 'utf8',
    });
  },
};
