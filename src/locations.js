import { normalizeName } from './commandParser.js';
import { logger } from './logger.js';

export class LocationManager {
  constructor(store) {
    this.store = store;
    this.locations = {};
  }

  load() {
    this.locations = this.store.readJson('locations.json', {});
  }

  save() {
    this.store.writeJson('locations.json', this.locations);
  }

  remember(name, position, createdBy) {
    const key = normalizeName(name);
    this.locations[key] = { ...position, createdBy, name };
    this.save();
    logger.info(`Ort ${name} gespeichert (${position.x}, ${position.y}, ${position.z}).`);
  }

  remove(name) {
    const key = normalizeName(name);
    if (this.locations[key]) {
      delete this.locations[key];
      this.save();
      return true;
    }
    return false;
  }

  list() {
    return Object.values(this.locations);
  }

  find(name) {
    const key = normalizeName(name);
    return this.locations[key] ?? null;
  }
}
