import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

import { DataStore } from '../src/storage.js';
import { LocationManager } from '../src/locations.js';

test('remember, list and find locations persist to storage', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gloeckchende-locations-'));
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const store = new DataStore(tempDir);
  const manager = new LocationManager(store);
  manager.load();

  const position = { x: 10.4, y: 64, z: -20.1, dimension: 'overworld' };
  manager.remember('Zuhause', position, 'Tester');

  const saved = manager.find('zuhause');
  assert.ok(saved);
  assert.equal(saved.createdBy, 'Tester');
  assert.equal(saved.x, position.x);

  const list = manager.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'Zuhause');
});
