export type WorkerStatus = {
  name: string;
  active: boolean;
  startedAt?: string;
  lastCompletedAt?: string;
  lastFailedAt?: string;
};

export class WorkerStatusRegistry {
  private static readonly workers = new Map<string, WorkerStatus>();

  static started(name: string): void {
    this.workers.set(name, {
      name,
      active: true,
      startedAt: new Date().toISOString(),
    });
  }

  static completed(name: string): void {
    const worker = this.workers.get(name);
    if (worker) worker.lastCompletedAt = new Date().toISOString();
  }

  static failed(name: string): void {
    const worker = this.workers.get(name);
    if (worker) worker.lastFailedAt = new Date().toISOString();
  }

  static list(): WorkerStatus[] {
    return [...this.workers.values()];
  }
}
