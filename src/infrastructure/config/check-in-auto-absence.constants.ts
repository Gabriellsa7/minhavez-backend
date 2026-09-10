export const checkInAutoAbsenceConfig = {
  queueName: 'check-in-auto-absence.queue',
  jobName: 'sweep-missed-check-ins',
  schedulerId: 'check-in-auto-absence-sweep',

  everyMs: Number(process.env.CHECK_IN_AUTO_ABSENCE_INTERVAL_MS) || 60_000,
};
