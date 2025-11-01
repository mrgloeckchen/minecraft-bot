import { logger } from './logger.js';

export class TaskManager {
  constructor(bot) {
    this.bot = bot;
    this.activeTask = null;
  }

  setTask(task) {
    this.activeTask = {
      ...task,
      progress: 0,
      createdAt: Date.now()
    };
    logger.info(`Neue Aufgabe: ${task.type}`);
  }

  clearTask(reason = 'abgebrochen') {
    if (this.activeTask) {
      logger.warn(`Aufgabe ${this.activeTask.type} ${reason}.`);
    }
    this.activeTask = null;
  }

  completeTask(type, reason = 'abgeschlossen') {
    if (this.activeTask?.type !== type) return;
    this.clearTask(reason);
  }

  tick() {
    if (!this.activeTask) return;
    switch (this.activeTask.type) {
      case 'collect':
        this.tickCollect();
        break;
      case 'follow':
        // NavigationManager übernimmt
        break;
      case 'navigate':
        break;
      default:
        break;
    }
  }

  tickCollect() {
    const task = this.activeTask;
    if (!task) return;
    task.progress += 1;
    if (task.progress % 10 === 0) {
      this.bot.sendPrivateMessage(task.requestedBy, `Ich habe ${task.progress} von ${task.count} ${task.item}.`);
    }
    if (task.progress >= task.count) {
      this.bot.sendPrivateMessage(task.requestedBy, `${task.count} ${task.item} gesammelt!`);
      this.clearTask('abgeschlossen');
    }
  }
}
