/**
 * CampusOS Structured Logger
 * Provides level-filtered, JSON-structured application logging with child context inheritance.
 */

export const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100
};

export class Logger {
  #context;
  #minLevel;
  #outputFn;

  constructor(options = {}) {
    const {
      context = {},
      level = process.env.LOG_LEVEL ||
        (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      outputFn = null
    } = options;

    this.#context = { ...context };
    this.#minLevel =
      (level && LOG_LEVELS[level.toLowerCase()]) || LOG_LEVELS.info;
    this.#outputFn = outputFn;
  }

  get context() {
    return { ...this.#context };
  }

  get level() {
    for (const [name, val] of Object.entries(LOG_LEVELS)) {
      if (val === this.#minLevel) return name;
    }
    return 'info';
  }

  setLevel(level) {
    if (level && LOG_LEVELS[level.toLowerCase()] !== undefined) {
      this.#minLevel = LOG_LEVELS[level.toLowerCase()];
    }
  }

  /**
   * Creates a child logger inheriting parent context and adding child context.
   * @param {object} childContext
   * @returns {Logger}
   */
  child(childContext = {}) {
    return new Logger({
      context: { ...this.#context, ...childContext },
      level: this.level,
      outputFn: this.#outputFn
    });
  }

  #log(levelName, message, meta = {}) {
    const levelValue = LOG_LEVELS[levelName];
    if (levelValue < this.#minLevel) {
      return;
    }

    let errorData = null;
    let extraMeta = meta;

    if (meta instanceof Error) {
      errorData = {
        name: meta.name,
        message: meta.message,
        stack: meta.stack,
        code: meta.code,
        statusCode: meta.statusCode,
        details: meta.details
      };
      extraMeta = {};
    } else if (meta && typeof meta === 'object') {
      if (meta.error instanceof Error) {
        errorData = {
          name: meta.error.name,
          message: meta.error.message,
          stack: meta.error.stack,
          code: meta.error.code,
          statusCode: meta.error.statusCode,
          details: meta.error.details
        };
        const extra = { ...meta };
        delete extra.error;
        extraMeta = extra;
      }
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      ...this.#context,
      ...extraMeta,
      ...(errorData ? { error: errorData } : {})
    };

    if (this.#outputFn) {
      this.#outputFn(logEntry);
      return;
    }

    const serialized = JSON.stringify(logEntry);
    if (levelName === 'error') {
      console.error(serialized);
    } else if (levelName === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  debug(message, meta) {
    this.#log('debug', message, meta);
  }

  info(message, meta) {
    this.#log('info', message, meta);
  }

  warn(message, meta) {
    this.#log('warn', message, meta);
  }

  error(message, meta) {
    this.#log('error', message, meta);
  }
}

export const rootLogger = new Logger({ context: { system: 'campus-os' } });

export default rootLogger;
