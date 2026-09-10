import os from 'os';
import Transport, { TransportStreamOptions } from 'winston-transport';

interface PapertrailHttpsTransportOptions extends TransportStreamOptions {
  endpoint: string;
  token: string;
}

const SYSLOG_SEVERITY_BY_LEVEL: Record<string, number> = {
  error: 3,
  warn: 4,
  info: 6,
  http: 6,
  verbose: 7,
  debug: 7,
  silly: 7,
};

const SYSLOG_FACILITY_LOCAL0 = 16;
const HOSTNAME = os.hostname();
const APP_NAME = process.env.SERVICE_NAME || 'minhavez-backend';
const MAX_BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 2000;

export class PapertrailHttpsTransport extends Transport {
  private readonly endpoint: string;

  private readonly token: string;

  private buffer: string[] = [];

  private flushTimer: NodeJS.Timeout | null = null;

  constructor(opts: PapertrailHttpsTransportOptions) {
    super(opts);
    this.endpoint = opts.endpoint;
    this.token = opts.token;
  }

  log(info: Record<string | symbol, unknown>, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    this.buffer.push(this.toSyslogLine(info));

    if (this.buffer.length >= MAX_BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS).unref();
    }

    callback();
  }

  close(): void {
    this.flush();
  }

  private flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const body = this.buffer.join('\n');
    this.buffer = [];

    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${this.token}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    }).catch((error) => {
      console.error('[papertrail] failed to ship log batch:', error);
    });
  }

  private toSyslogLine(info: Record<string | symbol, unknown>): string {
    const level = typeof info.level === 'string' ? info.level : 'info';
    const severity = SYSLOG_SEVERITY_BY_LEVEL[level] ?? 6;
    const pri = SYSLOG_FACILITY_LOCAL0 * 8 + severity;
    const timestamp =
      typeof info.timestamp === 'string'
        ? info.timestamp
        : new Date().toISOString();
    const message = JSON.stringify(info);

    return `<${pri}>1 ${timestamp} ${HOSTNAME} ${APP_NAME} - - - ${message}`;
  }
}
