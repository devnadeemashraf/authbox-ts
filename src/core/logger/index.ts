import cluster from 'node:cluster';

import pino, {
  type TransportMultiOptions,
  type TransportPipelineOptions,
  type TransportSingleOptions,
} from 'pino';

import { env } from '@/config/env';

type LoggerTransport = TransportSingleOptions | TransportMultiOptions | TransportPipelineOptions;

function getLoggerTransport(): LoggerTransport | undefined {
  if (env.NODE_ENV !== 'development') return undefined;

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
  level: env.LOG_LEVEL,
  base: {
    worker: cluster.isPrimary ? 'primary' : (cluster.worker?.id ?? 'unknown'),
  },
  transport: getLoggerTransport(),
});
