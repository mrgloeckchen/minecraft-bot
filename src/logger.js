import chalk from 'chalk';

const levels = {
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.gray
};

export function log(level, message, ...args) {
  const color = levels[level] || ((x) => x);
  const timestamp = new Date().toISOString();
  console.log(color(`[${timestamp}] [${level.toUpperCase()}] ${message}`), ...args);
}

export const logger = {
  info: (message, ...args) => log('info', message, ...args),
  warn: (message, ...args) => log('warn', message, ...args),
  error: (message, ...args) => log('error', message, ...args),
  debug: (message, ...args) => log('debug', message, ...args)
};
