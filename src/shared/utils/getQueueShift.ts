import { EQueueShift } from '../../domain/queue/interfaces/queue.interface';

export function getQueueShift(date: Date): EQueueShift {
  const hour = date.getHours();

  if (hour < 12) {
    return EQueueShift.MORNING;
  }

  return EQueueShift.AFTERNOON;
}
