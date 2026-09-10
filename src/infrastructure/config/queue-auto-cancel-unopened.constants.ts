export const queueAutoCancelUnopenedConfig = {
  queueName: 'queue-auto-cancel-unopened.queue',
  jobName: 'sweep-unopened-queues',
  schedulerId: 'queue-auto-cancel-unopened-sweep',

  everyMs:
    Number(process.env.QUEUE_AUTO_CANCEL_UNOPENED_INTERVAL_MS) || 2 * 60_000,
};
