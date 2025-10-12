import EventEmitter from 'eventemitter3';

export class WorldState extends EventEmitter {
  constructor() {
    super();
    this.self = {
      runtimeId: 0,
      position: { x: 0, y: 0, z: 0 },
      rotation: { yaw: 0, pitch: 0 },
      inventory: []
    };
    this.players = new Map();
    this.playerRuntimeLookup = new Map();
    this.entities = new Map();
  }

  updateSelf({ runtimeId, position, rotation }) {
    if (runtimeId != null) this.self.runtimeId = runtimeId;
    if (position) this.self.position = position;
    if (rotation) this.self.rotation = rotation;
    this.emit('selfUpdated', this.self);
  }

  updatePlayer(id, data) {
    const prev = this.players.get(id) ?? {};
    const next = { ...prev, ...data };
    this.players.set(id, next);
    if (next.runtimeId != null) {
      this.playerRuntimeLookup.set(next.runtimeId, id);
    }
    this.emit('playerUpdated', id, next);
  }

  removePlayer(id) {
    const player = this.players.get(id);
    if (player?.runtimeId != null) {
      this.playerRuntimeLookup.delete(player.runtimeId);
    }
    this.players.delete(id);
    this.emit('playerRemoved', id);
  }

  updateEntity(id, data) {
    const prev = this.entities.get(id) ?? {};
    const next = { ...prev, ...data };
    this.entities.set(id, next);
    this.emit('entityUpdated', id, next);
  }

  removeEntity(id) {
    this.entities.delete(id);
    this.emit('entityRemoved', id);
  }
}
