import { logger } from './logger.js';

const TOOL_MATERIAL_ORDER = ['wood', 'stone', 'iron', 'diamond', 'netherite'];

function matchesCandidate(itemId = '', candidate = '') {
  if (!itemId || !candidate) return false;
  if (itemId === candidate) return true;
  const [, candidateName = candidate] = candidate.split(':');
  if (!candidateName) return false;
  if (itemId.endsWith(`_${candidateName}`)) return true;
  if (itemId.endsWith(candidateName)) return true;
  if (itemId.includes(`_${candidateName}_`)) return true;
  return false;
}

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

    for (const [slot, item] of this.slots) {
      if (!item?.id) continue;
      if (!candidates.some((candidate) => matchesCandidate(item.id, candidate))) continue;
      const material = this.getMaterialTier(item);
      const durability = item?.durability ?? 100;
      const tierIndex = TOOL_MATERIAL_ORDER.indexOf(material);
      const score = tierIndex * 100 - (100 - durability);
      if (score > bestScore) {
        bestScore = score;
        best = { slot, item, material, durability };
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
