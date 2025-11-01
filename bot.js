'use strict';

const { createClient } = require('bedrock-protocol');
const { buildMovePlayerPacket } = require('./src/network/move_player');
const EventEmitter = require('events');

class BedrockBot extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.client = null;
    this.runtimeId = null;
    this.tick = 0n;
  }

  connect() {
    this.client = createClient({
      host: this.options.host,
      port: this.options.port,
      version: this.options.version,
      offline: this.options.offline,
      username: this.options.username,
      profilesFolder: this.options.profilesFolder
    });

    this.client.on('start_game', (packet) => {
      this.runtimeId = packet.runtime_entity_id ?? packet.runtimeEntityId;
      this.tick = 0n;
      this.emit('started');
    });

    this.client.on('tick_sync', (packet) => {
      this.tick = BigInt(packet.request_time ?? packet.client_tick ?? Number(this.tick) + 1);
    });
  }

  follow(target) {
    if (!this.client) throw new Error('Bot is not connected');
    if (this.runtimeId === null) throw new Error('Runtime ID missing, did the start_game packet fire?');

    const packet = buildMovePlayerPacket({
      runtimeId: this.runtimeId,
      tick: this.tick + 1n,
      position: target.position,
      rotation: target.rotation,
      onGround: true
    }, {
      // copy over the runtime id of the entity that we want to follow, if present
      entity_runtime_id: target.runtimeId !== undefined ? BigInt(target.runtimeId) : undefined
    });

    this.client.queue('move_player', packet);
    this.tick = packet.tick;
  }
}

module.exports = { BedrockBot };
