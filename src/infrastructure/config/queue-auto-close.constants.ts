const timezone = process.env.TZ || 'America/Sao_Paulo';

export const queueAutoCloseConfig = {
  queueName: 'queue-auto-close.queue',
  jobNames: {
    closeMorningShift: 'close-morning-shift',
    closeAfternoonShift: 'close-afternoon-shift',
  },
  timezone,
  cronPatterns: {
    // Runs daily at 12:00 to force-close any MORNING queue the professional
    // left open, and at 22:00 for AFTERNOON queues.
    closeMorningShift: process.env.QUEUE_AUTO_CLOSE_MORNING_CRON || '0 12 * * *',
    closeAfternoonShift:
      process.env.QUEUE_AUTO_CLOSE_AFTERNOON_CRON || '0 22 * * *',
  },
};
