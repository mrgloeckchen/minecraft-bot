import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

import { DataStore } from '../src/storage.js';
import { ZoneManager } from '../src/zones.js';

test('detects players entering configured zones', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gloeckchende-zones-'));
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const store = new DataStore(tempDir);
  fs.writeFileSync(store.getPath('locations.txt'), 'TestZone=0,0;10,10\n');
  store.writeJson('whitelist.json', { players: ['Deniz'] });

  const zones = new ZoneManager(store);
  zones.load();

  assert.ok(zones.checkPlayerPosition('Unbekannt', { x: 5, z: 5 }));
  assert.equal(zones.checkPlayerPosition('Deniz', { x: 5, z: 5 }), null);
});
