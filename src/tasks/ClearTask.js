import { BaseTask } from './BaseTask.js';

const faces = [1, 0, 2, 3, 4, 5];

export class ClearTask extends BaseTask {
  constructor(context) {
    super('clear', context);
    this.queue = [];
  }

  start(options) {
    this.queue = this.#generatePositions(options);
    super.start(options);
    this.context.feedback('🧹 Räume Bereich...');
  }

  execute() {
    const batch = this.queue.splice(0, this.context.config.tasks.clearBatchSize);
    if (!batch.length) {
      this.context.feedback('✅ Bereich ist frei.');
      this.stop();
      return;
    }
    batch.forEach((position) => {
      this.context.interaction.startBreak(position, faces[0]);
      this.context.scheduler.scheduleOnce(800, () => {
        if (!this.active) return;
        this.context.interaction.stopBreak(position, faces[0]);
      });
    });
  }

  #generatePositions({ x1, y1, z1, x2, y2, z2 }) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    const positions = [];
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          positions.push({ x, y, z });
        }
      }
    }
    return positions;
  }
}
