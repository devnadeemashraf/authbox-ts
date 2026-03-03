const noop = () => {};

/**
 * Mock logger for unit tests. Silences all log output.
 * Use with tsyringe: container.register(LoggerToken, { useValue: loggerMock })
 */
export const loggerMock = {
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
  child: () => loggerMock,
};
