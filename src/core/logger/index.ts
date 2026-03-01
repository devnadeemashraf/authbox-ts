import pino, {
  type TransportMultiOptions,
  type TransportPipelineOptions,
  type TransportSingleOptions,
} from 'pino';

type LoggerTransport = TransportSingleOptions | TransportMultiOptions | TransportPipelineOptions;

function getLoggerTransport(): LoggerTransport | undefined {
  // TODO: update to have a separate transport during production
  // if (!env.isDev) return undefined;

  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      colorizeObjects: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      levelFirst: true,
      messageFormat: '{msg}',
      singleLine: false,
      errorLikeObjectKeys: ['err', 'error'],
    },
  };
}

export type Logger = pino.Logger;
export const logger = pino({
  level: 'debug', // TODO: update to use env variable instead
  transport: getLoggerTransport(),
});
