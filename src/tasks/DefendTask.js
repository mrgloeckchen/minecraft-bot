import { BaseTask } from './BaseTask.js';

const HOSTILE_FAMILIES = ['monster', 'undead', 'arthropod'];

export class DefendTask extends BaseTask {
  constructor(context) {
    super('defend', context);
  }

  start() {
    super.start();
    this.context.feedback('🛡️ Verteidigung aktiviert.');
  }

  execute() {
    const threat = this.#findThreat();
    if (!threat) {
      this.context.movement.stop();
      return;
    }
    this.context.movement.moveTowards(threat.position, { stopDistance: 2.8, speed: 0.2 });
    this.context.movement.lookAt(threat.position);
    this.context.interaction.useBestToolFor({ name: 'sword' });
    this.context.interaction.attack(threat.runtimeId);
  }

  #findThreat() {
    const { entities } = this.context.worldState;
    const master = this.context.worldState.players.get(this.context.masterName);
    if (!master?.position) return null;
    let best = null;
    let bestDistance = 64;
    entities.forEach((entity) => {
      if (!entity?.position) return;
      if (!HOSTILE_FAMILIES.includes(entity.family)) return;
      const dx = entity.position.x - master.position.x;
      const dy = entity.position.y - master.position.y;
      const dz = entity.position.z - master.position.z;
      const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = entity;
      }
    });
    return best;
  }
}
