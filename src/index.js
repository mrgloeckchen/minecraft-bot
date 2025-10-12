import { Marvin } from './bot/Marvin.js';
import { logger } from './utils/logger.js';

const bot = new Marvin();

bot.start().catch((error) => {
  logger.error('Fehler beim Start von Marvin', error);
  process.exit(1);
});
