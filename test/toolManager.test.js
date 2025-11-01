import test from 'node:test';
import assert from 'node:assert/strict';

import { InventoryManager } from '../src/inventory.js';
import { ToolManager } from '../src/toolManager.js';

test('suggestToolForBlock returns highest tier available tool', () => {
  const inventory = new InventoryManager();
  inventory.updateSlot(0, { id: 'minecraft:iron_pickaxe', durability: 60 });
  inventory.updateSlot(1, { id: 'minecraft:diamond_pickaxe', durability: 10 });
  inventory.updateSlot(2, { id: 'minecraft:stone_pickaxe', durability: 80 });

  const toolManager = new ToolManager(inventory, { lowDurabilityThreshold: 5 });

  const suggestion = toolManager.suggestToolForBlock('minecraft:diamond_ore');
  assert.ok(suggestion, 'expected a tool suggestion');
  assert.equal(suggestion.item.id, 'minecraft:diamond_pickaxe');
});

test('suggestToolForBlock respects durability threshold', () => {
  const inventory = new InventoryManager();
  inventory.updateSlot(0, { id: 'minecraft:iron_pickaxe', durability: 3 });

  const toolManager = new ToolManager(inventory, { lowDurabilityThreshold: 5 });
  const suggestion = toolManager.suggestToolForBlock('minecraft:stone');
  assert.equal(suggestion, null);
});

