export const queueWindowPromotionConfig = {
  queueName: 'queue-window-promotion.queue',
  jobName: 'promote-due-queue-items',
  schedulerId: 'queue-window-promotion-sweep',

  everyMs: Number(process.env.QUEUE_WINDOW_PROMOTION_INTERVAL_MS) || 60_000,
};
