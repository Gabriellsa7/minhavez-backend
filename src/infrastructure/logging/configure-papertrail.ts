import { LoggerTraceability } from 'traceability';
import { PapertrailHttpsTransport } from './papertrail-https.transport';

/**
 * Adds Papertrail as an extra log transport when the required env vars are
 * set, keeping whatever transports (e.g. Console) are already configured.
 */
export function configurePapertrailLogging(): void {
  const endpoint = process.env.PAPERTRAIL_HTTPS_ENDPOINT;
  const token = process.env.PAPERTRAIL_TOKEN;

  if (!endpoint || !token) {
    return;
  }

  const logger = LoggerTraceability.getInstance().getLogger();

  LoggerTraceability.configure({
    transports: [
      ...logger.transports,
      new PapertrailHttpsTransport({ endpoint, token }),
    ],
  });
}
