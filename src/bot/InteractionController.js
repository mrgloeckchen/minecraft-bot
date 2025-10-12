import { logger } from '../utils/logger.js';

export class InteractionController {
  constructor(client, worldState, toolManager) {
    this.client = client;
    this.worldState = worldState;
    this.toolManager = toolManager;
  }

  useBestToolFor(block) {
    const tool = this.toolManager.getBestToolFor(block?.name ?? block?.id ?? '');
    if (!tool) return false;
    this.selectHotbar(tool.slot);
    return true;
  }

  selectHotbar(slot) {
    if (slot == null) return;
    this.client.queue('mob_equipment', {
      runtime_id: this.worldState.self.runtimeId,
      item: this.worldState.self.inventory?.[slot] ?? { network_id: 0 },
      inventory_slot: slot,
      hotbar_slot: slot,
      window_id: 'inventory'
    });
  }

  startBreak(position, face = 1) {
    this.client.queue('player_action', {
      runtime_id: this.worldState.self.runtimeId,
      action: 'start_break',
      position,
      face
    });
  }

  stopBreak(position, face = 1) {
    this.client.queue('player_action', {
      runtime_id: this.worldState.self.runtimeId,
      action: 'stop_break',
      position,
      face
    });
  }

  attack(runtimeId) {
    logger.info(`Attacking entity ${runtimeId}`);
    this.client.queue('inventory_transaction', {
      transaction: {
        transaction_type: 'item_use_on_entity',
        runtime_id,
        actions: []
      }
    });
  }

  place(position, face, hotbarSlot) {
    this.selectHotbar(hotbarSlot);
    this.client.queue('inventory_transaction', {
      transaction: {
        transaction_type: 'item_use_on',
        block_position: position,
        block_face: face,
        hotbar_slot: hotbarSlot,
        actions: []
      }
    });
  }
}
