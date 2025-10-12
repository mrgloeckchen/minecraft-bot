import { BaseTask } from './BaseTask.js';

export class FollowTask extends BaseTask {
  constructor(context) {
    super('follow', context);
  }

  start() {
    super.start();
    this.context.feedback('👣 Ich folge dir.');
  }

  execute() {
    const master = this.context.worldState.players.get(this.context.masterName);
    if (!master?.position) {
      this.context.feedback('🔍 Ich finde dich nicht. Bitte komm in Sichtweite.');
      this.stop();
      return;
    }
    const reached = this.context.movement.moveTowards(master.position, {
      stopDistance: this.context.config.movement.followDistance
    });
    if (reached) {
      this.context.movement.lookAt(master.position);
    }
  }
}
