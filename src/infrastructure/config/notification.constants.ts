export const notificationQueueConfig = {
  queueNames: {
    notification: 'notification.queue',
    appointment: 'appointment.queue',
    failed: 'notification.failed.queue',
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
    delay: 0,
    ttl: 1000 * 60 * 60 * 24,
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
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    delay: 1000,
  },
  ttl: 1000 * 60 * 60 * 24,
  priorities: {
    reminder: 1,
    queueNear: 2,
    queueNext: 3,
    default: 3,
  },
};
