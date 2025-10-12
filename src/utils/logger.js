import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

const logStream = createWriteStream(resolve('marvin.log'), { flags: 'a' });

const format = (level, message) => {
  const time = new Date().toISOString();
  return `[${time}] [${level}] ${message}`;
};

export const logger = {
  info(message) {
    const line = format('INFO', message);
    console.log(line);
    logStream.write(`${line}\n`);
  },
  warn(message) {
    const line = format('WARN', message);
    console.warn(line);
    logStream.write(`${line}\n`);
  },
  error(message, error) {
    const suffix = error ? `\n${error.stack ?? error}` : '';
    const line = format('ERROR', message);
    console.error(line, suffix);
    logStream.write(`${line}${suffix ? `\n${suffix}` : ''}\n`);
  }
};
