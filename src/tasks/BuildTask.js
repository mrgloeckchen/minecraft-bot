import { BaseTask } from './BaseTask.js';

export class BuildTask extends BaseTask {
  constructor(context) {
    super('build', context);
    this.queue = [];
  }

  start(options) {
    super.start(options);
    this.queue = [...options.blueprint.blocks];
    this.context.feedback(`🏗️ Baue ${options.blueprint.name} (${this.queue.length} Blöcke).`);
  }

  execute() {
    if (!this.queue.length) {
      this.context.feedback('✅ Blueprint fertig.');
      this.stop();
      return;
    }
    const instruction = this.queue.shift();
    const worldPos = {
      x: instruction.position.x + (this.options.origin?.x ?? 0),
      y: instruction.position.y + (this.options.origin?.y ?? 0),
      z: instruction.position.z + (this.options.origin?.z ?? 0)
    };
    this.context.movement.moveTowards(worldPos, { stopDistance: 2.2 });
    this.context.interaction.place(worldPos, instruction.face ?? 1, instruction.hotbarSlot ?? 0);
    this.context.feedback(`🧱 ${this.options.blueprint.name}: ${this.queue.length} übrig.`);
  }
}
