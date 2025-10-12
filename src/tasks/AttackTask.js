import { BaseTask } from './BaseTask.js';

export class AttackTask extends BaseTask {
  constructor(context) {
    super('attack', context);
  }

  start(options) {
    super.start(options);
    this.context.feedback(`🎯 Ziel ${options.target} angegriffen.`);
  }

  execute() {
    const { target } = this.options;
    const entity = this.#findTarget(target);
    if (!entity) {
      this.context.feedback('👀 Ziel nicht gefunden.');
      this.stop();
      return;
    }
    const reached = this.context.movement.moveTowards(entity.position, { stopDistance: 2.4, speed: 0.2 });
    this.context.movement.lookAt(entity.position);
    if (reached) {
      this.context.interaction.useBestToolFor({ name: 'sword' });
      this.context.interaction.attack(entity.runtimeId);
    }
  }

  #findTarget(name) {
    const lower = name.toLowerCase();
    for (const player of this.context.worldState.players.values()) {
      if (player.name?.toLowerCase() === lower) return player;
    }
    for (const entity of this.context.worldState.entities.values()) {
      if (entity.name?.toLowerCase() === lower) return entity;
    }
    return null;
  }
}
