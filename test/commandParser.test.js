import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCommand } from '../src/commandParser.js';

test('parse collect command with amount and item', () => {
  const result = parseCommand('sammel 32 eichenbretter');
  assert.equal(result.type, 'collect');
  assert.equal(result.count, 32);
  assert.equal(result.item, 'eichenbretter');
});

test('parse remember location command trims spaces', () => {
  const result = parseCommand('  merk dir   Zuhause  ');
  assert.equal(result.type, 'rememberLocation');
  assert.equal(result.name, 'Zuhause');
});

test('unknown command falls back gracefully', () => {
  const result = parseCommand('mach was');
  assert.equal(result.type, 'unknown');
  assert.equal(result.raw, 'mach was');
});
