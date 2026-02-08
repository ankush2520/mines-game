export class AutoMode {
  private intervalMs: number;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(intervalMs = 600) {
    this.intervalMs = intervalMs;
  }

  start(action: () => void): void {
    if (this.timerId) return;
    this.timerId = setInterval(action, this.intervalMs);
  }

  stop(): void {
    if (!this.timerId) return;
    clearInterval(this.timerId);
    this.timerId = null;
  }

  isRunning(): boolean {
    return this.timerId !== null;
  }
}
