const retryAttempts = Number(process.env.NOTIFICATION_RETRY_ATTEMPTS || 3);
const retryDelay = Number(process.env.NOTIFICATION_RETRY_DELAY || 2000);
const queueTtl = Number(process.env.NOTIFICATION_QUEUE_TTL || 1000 * 60 * 60 * 24);

export const notificationQueueConfig = {
  queueNames: {
    notification: 'notification.queue',
    appointment: 'appointment.queue',
    failed: 'notification.failed.queue',
  },
  defaultJobOptions: {
    attempts: retryAttempts,
    backoff: {
      type: 'exponential' as const,
      delay: retryDelay,
    },
    removeOnComplete: true,
    removeOnFail: false,
    delay: 0,
    ttl: queueTtl,
  },
  thresholds: [10, 5, 3, 2, 1],
  priorities: {
    default: 3,
    high: 1,
    low: 5,
  },
};

export const notificationConfig = {
  retry: {
    attempts: retryAttempts,
    backoff: {
      type: 'exponential' as const,
      delay: retryDelay,
    },
    delay: 1000,
  },
  ttl: queueTtl,
  priorities: {
    reminder: 1,
    queueNear: 2,
    queueNext: 3,
    default: 3,
  },
};
