import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InventoryManager } from './inventory.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', file), 'utf8'));
}

const TOOL_ALIASES = loadJson('tool_alias.de.json');
const ITEMS_DE = loadJson('items.de.json');
const MIN_TIERS = loadJson('min_tier.json');
const COMBAT_PREFS = loadJson('combat_prefs.json');

const BLOCK_TOOL_MAP = {
  stone: ['spitzhacke'],
  ore: ['spitzhacke'],
  wood: ['axt'],
  log: ['axt'],
  dirt: ['schaufel'],
  sand: ['schaufel'],
  gravel: ['schaufel'],
  plant: ['hacke'],
  leaves: ['schere'],
  wool: ['schere']
};

function resolveToolIds(toolKeys = []) {
  const ids = new Set();
  toolKeys.forEach((key) => {
    const base = ITEMS_DE[key] || `minecraft:${key}`;
    ids.add(base);
    const aliases = TOOL_ALIASES[key] || [];
    aliases.forEach((alias) => ids.add(ITEMS_DE[alias] || `minecraft:${alias}`));
  });
  return Array.from(ids);
}

export class ToolManager {
  constructor(inventory = new InventoryManager(), config = {}) {
    this.inventory = inventory;
    this.config = config;
  }

  suggestToolForBlock(blockId) {
    const minTier = MIN_TIERS[blockId] || 'wood';
    const category = this.getBlockCategory(blockId);
    const toolKeys = BLOCK_TOOL_MAP[category] || [];
    const candidateIds = resolveToolIds(toolKeys);
    const best = this.inventory.getBestTool(candidateIds);
    if (!best) {
      logger.warn(`Kein Werkzeug für ${blockId} gefunden.`, { toolKeys });
      return null;
    }

    const tierAllowed = this.isTierAllowed(best.material, minTier);
    if (!tierAllowed) {
      logger.warn(`Werkzeug-Tier zu niedrig (${best.material} < ${minTier}).`);
      return null;
    }

    if (best.durability < this.config.lowDurabilityThreshold) {
      logger.warn(`Werkzeug-Haltbarkeit niedrig (${best.durability}).`);
      return null;
    }

    return best;
  }

  getCombatLoadout() {
    const melee = this.inventory.getBestTool(COMBAT_PREFS.preferredMelee);
    const ranged = this.inventory.getBestTool(COMBAT_PREFS.preferredRanged);
    const shield = this.inventory.find((item) => item?.id === COMBAT_PREFS.shield);

    return {
      melee: melee?.item || null,
      ranged: ranged?.item || null,
      shield: shield?.item || null
    };
  }

  getBlockCategory(blockId = '') {
    if (blockId.includes('log') || blockId.includes('wood')) return 'wood';
    if (blockId.includes('ore')) return 'ore';
    if (blockId.includes('leaves')) return 'leaves';
    if (blockId.includes('wool')) return 'wool';
    if (blockId.includes('dirt') || blockId.includes('grass')) return 'dirt';
    if (blockId.includes('sand') || blockId.includes('gravel')) return 'sand';
    if (blockId.includes('stone') || blockId.includes('cobblestone')) return 'stone';
    if (blockId.includes('plant') || blockId.includes('crop')) return 'plant';
    return 'stone';
  }

  isTierAllowed(material, required) {
    const order = ['wood', 'stone', 'iron', 'diamond', 'netherite'];
    return order.indexOf(material) >= order.indexOf(required);
  }
}
