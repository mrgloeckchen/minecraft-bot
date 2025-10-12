import EventEmitter from 'eventemitter3';
import { logger } from '../utils/logger.js';

export class TaskRunner extends EventEmitter {
  constructor(context, tickRate = 4) {
    super();
    this.context = context;
    this.tickRate = tickRate;
    this.tasks = new Map();
    this.activeTask = null;
    this.interval = null;
  }

  register(task) {
    this.tasks.set(task.name, task);
    task.on('stopped', (reason) => {
      if (this.activeTask?.name === task.name && reason !== 'switch') {
        this.activeTask = null;
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = null;
        }
        this.emit('idle');
      }
    });
  }

  start(taskName, options) {
    const task = this.tasks.get(taskName);
    if (!task) {
      logger.warn(`Task ${taskName} not registered`);
      return false;
    }
    if (this.activeTask) {
      this.activeTask.stop('switch');
    }
    this.activeTask = task;
    task.start(options);
    this.emit('taskStarted', { task: task.name, options });
    if (!this.interval) {
      const intervalMs = 1000 / this.tickRate;
      const interval = setInterval(() => this.#tick(), intervalMs);
      interval.unref?.();
      this.interval = interval;
    }
    return true;
  }

  stopActive(reason = 'stopped') {
    if (!this.activeTask) return;
    this.activeTask.stop(reason);
    this.activeTask = null;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  #tick() {
    if (!this.activeTask) return;
    try {
      this.activeTask.tick();
    } catch (error) {
      logger.error(`Task ${this.activeTask.name} crashed`, error);
      this.activeTask.stop('error');
      this.activeTask = null;
    }
  }
}
