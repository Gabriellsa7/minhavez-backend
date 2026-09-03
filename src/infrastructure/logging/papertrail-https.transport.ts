import os from 'os';
import Transport, { TransportStreamOptions } from 'winston-transport';

interface PapertrailHttpsTransportOptions extends TransportStreamOptions {
  endpoint: string;
  token: string;
}

// RFC 5424 syslog severities, mapped from winston's npm log levels.
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

/**
 * Ships logs to Papertrail (SolarWinds Observability) using its HTTPS
 * "single log" ingestion endpoint. Requests are fire-and-forget so a slow
 * or unreachable Papertrail never blocks application logging.
 *
 * Lines are wrapped as RFC 5424 syslog so Papertrail parses the severity
 * (and colors error/warn accordingly) instead of treating the payload as an
 * unclassified raw string.
 */
export class PapertrailHttpsTransport extends Transport {
  private readonly endpoint: string;

  private readonly token: string;

  constructor(opts: PapertrailHttpsTransportOptions) {
    super(opts);
    this.endpoint = opts.endpoint;
    this.token = opts.token;
  }

  log(info: Record<string | symbol, unknown>, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const body = this.toSyslogLine(info);

    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${this.token}`,
      },
      body,
      signal: AbortSignal.timeout(5000),
    }).catch((error) => {
      console.error('[papertrail] failed to ship log:', error);
    });

    callback();
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
