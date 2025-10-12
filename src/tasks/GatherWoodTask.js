import { BaseTask } from './BaseTask.js';

const WOOD_KEYWORDS = ['log', 'wood'];

export class GatherWoodTask extends BaseTask {
  constructor(context) {
    super('gather_wood', context);
    this.progress = 0;
  }

  start(options) {
    this.progress = 0;
    const normalized = {
      ...options,
      quantity: options.quantity && options.quantity > 0 ? options.quantity : null
    };
    super.start(normalized);
    const targetAmount = normalized.quantity ?? '∞';
    this.context.feedback(`🪓 Starte Holzfarm (${targetAmount} ${normalized.woodType}).`);
  }

  execute() {
    const { woodType, quantity } = this.options;
    if (quantity && this.progress >= quantity) {
      this.context.feedback(`✅ Holz ${this.progress}/${quantity}`);
      this.stop();
      return;
    }

    const target = this.context.scanner.findNearestBlock((entry) => {
      const name = entry.blockState?.name?.toLowerCase() ?? '';
      return WOOD_KEYWORDS.some((keyword) => name.includes(keyword)) &&
        (!woodType || name.includes(woodType.toLowerCase()));
    });

    if (!target) {
      this.context.feedback('🌲 Kein Holz in Reichweite gefunden.');
      this.stop();
      return;
    }

    this.context.movement.moveTowards(target.position, { stopDistance: 1.8 });
    const toolEquipped = this.context.interaction.useBestToolFor(target.blockState);
    if (!toolEquipped) {
      this.context.feedback('⚠️ Kein geeignetes Werkzeug.');
    }
    this.context.interaction.startBreak(target.position, 1);
    this.context.scheduler.scheduleOnce(1200, () => {
      if (!this.active) return;
      this.context.interaction.stopBreak(target.position, 1);
      this.progress += 1;
      this.context.feedback(`🪓 Holz ${this.progress}/${quantity || '∞'}`);
    });
  }
}
