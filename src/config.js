export const config = {
  host: process.env.BEDROCK_HOST ?? '127.0.0.1',
  port: Number.parseInt(process.env.BEDROCK_PORT ?? '19132', 10),
  username: process.env.BEDROCK_USERNAME ?? 'Marvin',
  offline: process.env.BEDROCK_AUTH === 'offline',
  authTitle: process.env.BEDROCK_AUTH_TITLE,
  enableChatLogging: process.env.BEDROCK_LOG_CHAT !== 'false',
  commandPrefix: '/tell',
  masterPlayer: process.env.MARVIN_MASTER ?? 'mrgloeckchen',
  movement: {
    tickRate: Number.parseInt(process.env.MARVIN_TICK_RATE ?? '4', 10),
    followDistance: Number.parseFloat(process.env.MARVIN_FOLLOW_DISTANCE ?? '2.5')
  },
  tasks: {
    clearBatchSize: Number.parseInt(process.env.MARVIN_CLEAR_BATCH ?? '128', 10)
  }
};
