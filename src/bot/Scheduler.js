export class Scheduler {
  constructor() {
    this.timeouts = new Set();
  }

  scheduleOnce(delayMs, callback) {
    const timeout = setTimeout(() => {
      this.timeouts.delete(timeout);
      callback();
    }, delayMs);
    this.timeouts.add(timeout);
    timeout.unref?.();
    return timeout;
  }

  clearAll() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
  }
}
