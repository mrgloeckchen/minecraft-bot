const TOOL_PRIORITIES = [
  { name: 'netherite', durability: 2031 },
  { name: 'diamond', durability: 1561 },
  { name: 'iron', durability: 250 },
  { name: 'stone', durability: 131 },
  { name: 'gold', durability: 32 },
  { name: 'wood', durability: 59 }
];

const TOOL_TYPES = {
  axe: ['axe', 'hatchet'],
  shovel: ['shovel'],
  pickaxe: ['pickaxe'],
  sword: ['sword'],
  hoe: ['hoe']
};

const findToolScore = (item) => {
  if (!item?.name) return null;
  const type = Object.entries(TOOL_TYPES).find(([, keywords ]) =>
    keywords.some((keyword) => item.name.toLowerCase().includes(keyword))
  );
  if (!type) return null;
  const tier = TOOL_PRIORITIES.findIndex(({ name }) => item.name.toLowerCase().includes(name));
  return {
    type: type[0],
    tier: tier === -1 ? TOOL_PRIORITIES.length : tier,
    durability: item.damage != null ? item.damage : TOOL_PRIORITIES[tier]?.durability ?? 0
  };
};

export class ToolManager {
  constructor() {
    this.inventory = [];
    this.toolsByType = new Map();
  }

  refreshInventory(inventory) {
    this.inventory = inventory ?? [];
    this.toolsByType.clear();
    this.inventory.forEach((item, slot) => {
      if (!item) return;
      const score = findToolScore(item);
      if (!score) return;
      const list = this.toolsByType.get(score.type) ?? [];
      list.push({ item, slot, score });
      this.toolsByType.set(score.type, list);
    });
    this.toolsByType.forEach((list, type) => {
      list.sort((a, b) => a.score.tier - b.score.tier || b.score.durability - a.score.durability);
      this.toolsByType.set(type, list);
    });
  }

  getBestToolFor(blockType) {
    if (!blockType) return null;
    const desiredType = this.#toolTypeForBlock(blockType);
    if (!desiredType) return null;
    const tools = this.toolsByType.get(desiredType);
    return tools?.[0] ?? null;
  }

  #toolTypeForBlock(block) {
    const name = typeof block === 'string' ? block : block?.name ?? '';
    if (!name) return null;
    if (name.includes('log') || name.includes('wood')) return 'axe';
    if (name.includes('stone') || name.includes('ore') || name.includes('deepslate')) return 'pickaxe';
    if (name.includes('dirt') || name.includes('sand') || name.includes('gravel')) return 'shovel';
    if (name.includes('sword')) return 'sword';
    return null;
  }
}
