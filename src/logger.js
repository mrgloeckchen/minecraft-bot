let chalk;
try {
  ({ default: chalk } = await import('chalk'));
} catch {
  chalk = null;
}

const identity = (value) => value;

const levels = {
  info: chalk?.cyan ?? identity,
  warn: chalk?.yellow ?? identity,
  error: chalk?.red ?? identity,
  debug: chalk?.gray ?? identity
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
