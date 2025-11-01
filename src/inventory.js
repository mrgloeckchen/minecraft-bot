import { logger } from './logger.js';

const TOOL_MATERIAL_ORDER = ['wood', 'stone', 'iron', 'diamond', 'netherite'];

export class InventoryManager {
  constructor() {
    this.slots = new Map();
    this.hotbarStart = 0;
  }

  updateSlot(slot, item) {
    if (item) {
      this.slots.set(slot, {
        ...item,
        name: item?.name || item?.id || 'unbekannt'
      });
    } else {
      this.slots.delete(slot);
    }
  }

  applyInventory(items = []) {
    items.forEach((item, idx) => this.updateSlot(idx, item));
    logger.debug(`Inventar aktualisiert (${this.slots.size} Slots).`);
  }

  getItems() {
    return Array.from(this.slots.values());
  }

  find(predicate) {
    for (const [slot, item] of this.slots) {
      if (predicate(item, slot)) {
        return { slot, item };
      }
    }
    return null;
  }

  getBestTool(candidates = []) {
    let best = null;
    let bestScore = -Infinity;

    for (const id of candidates) {
      const found = this.find((item) => item?.id === id);
      if (!found) continue;
      const material = this.getMaterialTier(found.item);
      const durability = found.item?.durability ?? 9999;
      const score = TOOL_MATERIAL_ORDER.indexOf(material) * 100 - (100 - durability);
      if (score > bestScore) {
        bestScore = score;
        best = { ...found, material, durability };
      }
    }
    return best;
  }

  getMaterialTier(item) {
    if (!item?.id) return 'wood';
    if (item.id.includes('netherite')) return 'netherite';
    if (item.id.includes('diamond')) return 'diamond';
    if (item.id.includes('iron')) return 'iron';
    if (item.id.includes('stone')) return 'stone';
    if (item.id.includes('wood') || item.id.includes('gold')) return 'wood';
    return 'wood';
  }
}
