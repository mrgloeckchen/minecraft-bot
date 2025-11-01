import { logger } from './logger.js';

function parseZoneLine(line) {
  const [name, coords] = line.split('=');
  if (!coords) return null;
  const [start, end] = coords.split(';');
  if (!start || !end) return null;
  const [x1, z1] = start.split(',').map(Number);
  const [x2, z2] = end.split(',').map(Number);
  return {
    name: name.trim(),
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minZ: Math.min(z1, z2),
    maxZ: Math.max(z1, z2)
  };
}

export class ZoneManager {
  constructor(store) {
    this.store = store;
    this.zones = [];
    this.whitelist = new Set();
  }

  load() {
    this.zones = this.store.readLines('locations.txt').map(parseZoneLine).filter(Boolean);
    const whitelist = this.store.readJson('whitelist.json', { players: [] });
    this.whitelist = new Set((whitelist.players || []).map((p) => p.toLowerCase()));
    logger.info(`Zonen geladen: ${this.zones.length}, Whitelist: ${this.whitelist.size} Spieler.`);
  }

  isWhitelisted(player) {
    return this.whitelist.has(player.toLowerCase());
  }

  checkPlayerPosition(player, position) {
    if (this.isWhitelisted(player)) return null;
    for (const zone of this.zones) {
      if (
        position.x >= zone.minX &&
        position.x <= zone.maxX &&
        position.z >= zone.minZ &&
        position.z <= zone.maxZ
      ) {
        logger.warn(`${player} hat Zone ${zone.name} betreten.`);
        return zone;
      }
    }
    return null;
  }
}
