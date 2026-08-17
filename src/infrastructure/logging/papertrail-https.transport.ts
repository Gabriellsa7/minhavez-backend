import Transport, { TransportStreamOptions } from 'winston-transport';

interface PapertrailHttpsTransportOptions extends TransportStreamOptions {
  endpoint: string;
  token: string;
}

/**
 * Ships logs to Papertrail (SolarWinds Observability) using its HTTPS
 * "single log" ingestion endpoint. Requests are fire-and-forget so a slow
 * or unreachable Papertrail never blocks application logging.
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

    const body = JSON.stringify(info);

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
}
