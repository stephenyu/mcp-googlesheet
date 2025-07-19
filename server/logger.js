export class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.debugMode = process.env.DEBUG === 'true';
  }

  _log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (args.length > 0) {
      console.error(prefix, message, ...args);
    } else {
      console.error(prefix, message);
    }
  }

  debug(message, ...args) {
    if (this.debugMode || this.logLevel === 'debug') {
      this._log('debug', message, ...args);
    }
  }

  info(message, ...args) {
    if (['debug', 'info'].includes(this.logLevel)) {
      this._log('info', message, ...args);
    }
  }

  warn(message, ...args) {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      this._log('warn', message, ...args);
    }
  }

  error(message, ...args) {
    if (['debug', 'info', 'warn', 'error'].includes(this.logLevel)) {
      this._log('error', message, ...args);
    }
  }

  // Special method for MCP-specific logging
  mcp(message, ...args) {
    this.debug(`[MCP] ${message}`, ...args);
  }
} 