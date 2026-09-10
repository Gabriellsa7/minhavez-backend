const timezone = process.env.TZ || 'America/Sao_Paulo';

export const queueAutoCloseConfig = {
  queueName: 'queue-auto-close.queue',
  jobNames: {
    closeMorningShift: 'close-morning-shift',
    closeAfternoonShift: 'close-afternoon-shift',
  },
  timezone,
  cronPatterns: {
    closeMorningShift:
      process.env.QUEUE_AUTO_CLOSE_MORNING_CRON || '0 12 * * *',
    closeAfternoonShift:
      process.env.QUEUE_AUTO_CLOSE_AFTERNOON_CRON || '0 22 * * *',
  },
};
