/**
 * Logger utility - Replaces console.log with environment-aware logging
 * 
 * Usage:
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('User logged in', { userId: 123 });
 * logger.error('API call failed', error);
 * logger.debug('Debug info', data);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  includeTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    // Only enable logging in development
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: 'debug',
      includeTimestamp: true,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.config.includeTimestamp
      ? `[${new Date().toISOString()}]`
      : '';
    const levelStr = `[${level.toUpperCase()}]`;
    return `${timestamp} ${levelStr} ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('debug')) return;
    console.log(`🔍 ${this.formatMessage('debug', message)}`, data || '');
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('info')) return;
    console.info(`ℹ️ ${this.formatMessage('info', message)}`, data || '');
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('warn')) return;
    console.warn(`⚠️ ${this.formatMessage('warn', message)}`, data || '');
  }

  error(message: string, error?: any) {
    if (!this.shouldLog('error')) return;
    console.error(`❌ ${this.formatMessage('error', message)}`, error || '');
    
    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error);
  }

  // Special loggers for specific features
  socket = {
    connected: () => this.info('Socket connected'),
    disconnected: (reason: string) => this.warn('Socket disconnected', { reason }),
    error: (error: any) => this.error('Socket error', error),
    message: (event: string, data: any) => this.debug(`Socket event: ${event}`, data),
  };

  api = {
    request: (method: string, url: string) => this.debug(`API ${method}`, { url }),
    response: (status: number, url: string) => this.debug(`API Response ${status}`, { url }),
    error: (error: any, url: string) => this.error('API Error', { error, url }),
  };

  chat = {
    messageSent: (chatId: string) => this.debug('Message sent', { chatId }),
    messageReceived: (chatId: string) => this.debug('Message received', { chatId }),
    typing: (chatId: string, isTyping: boolean) => this.debug('Typing indicator', { chatId, isTyping }),
  };

  // Configure logger (useful for testing)
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Disable all logging (for production)
  disable() {
    this.config.enabled = false;
  }

  // Enable logging (for development)
  enable() {
    this.config.enabled = true;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
