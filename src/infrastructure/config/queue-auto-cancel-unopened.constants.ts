export const queueAutoCancelUnopenedConfig = {
  queueName: 'queue-auto-cancel-unopened.queue',
  jobName: 'sweep-unopened-queues',
  schedulerId: 'queue-auto-cancel-unopened-sweep',
  // The tolerance itself is 10 minutes (QueueService), so a 2-minute sweep
  // interval keeps patients from waiting much past that mark without
  // hammering the database.
  everyMs: Number(process.env.QUEUE_AUTO_CANCEL_UNOPENED_INTERVAL_MS) || 2 * 60_000,
};
