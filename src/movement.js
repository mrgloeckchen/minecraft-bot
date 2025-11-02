import { logger } from './logger.js';

const DEFAULT_WALK_SPEED = 0.35;
const DEFAULT_ASCEND_STEP = 0.5;

export class MovementController {
  constructor(bot) {
    this.bot = bot;
    this.position = { x: 0, y: 0, z: 0 };
    this.yaw = 0;
    this.pitch = 0;
    this.sequence = 0n;
    this.walkSpeed = bot.config.walkSpeed ?? DEFAULT_WALK_SPEED;
    this.maxVerticalStep = bot.config.maxVerticalStep ?? DEFAULT_ASCEND_STEP;
  }

  initializeFromStartGame(packet) {
    this.position = {
      x: packet.player_position.x,
      y: packet.player_position.y,
      z: packet.player_position.z
    };

    const runtimeIdBigInt = this.bot.selfRuntimeIdBigInt;

    try {
      this.bot.client.queue('client_cache_status', { enabled: false });
      this.bot.client.queue('request_chunk_radius', {
        chunk_radius: this.bot.config.chunkRadius ?? 6
      });
      if (runtimeIdBigInt != null) {
        this.bot.client.queue('set_local_player_as_initialized', {
          runtime_entity_id: runtimeIdBigInt,
          entity_id: runtimeIdBigInt
        });
      } else {
        logger.warn('Initialisierung ohne gültige Runtime-ID.');
      }
      logger.info('Lokaler Spieler initialisiert.');
    } catch (err) {
      logger.error(`Initialisierung fehlgeschlagen: ${err.message}`);
    }
  }

  updateServerPosition(position) {
    this.position = { ...position };
  }

  moveTowards(targetPosition, tolerance = 0.75) {
    if (!this.bot?.client) return false;

    const dx = targetPosition.x - this.position.x;
    const dy = targetPosition.y - this.position.y;
    const dz = targetPosition.z - this.position.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    if (horizontalDistance <= tolerance && Math.abs(dy) <= this.maxVerticalStep) {
      return true;
    }

    const step = Math.min(this.walkSpeed, horizontalDistance || this.walkSpeed);
    const yaw = Math.atan2(-dx, dz);
    const nx = this.position.x + Math.sin(yaw) * step;
    const nz = this.position.z + Math.cos(yaw) * step;
    const clampDy = Math.max(Math.min(dy, this.maxVerticalStep), -this.maxVerticalStep);
    const ny = this.position.y + clampDy;

    this.queueMove({ x: nx, y: ny, z: nz }, yaw);
    return false;
  }

  queueMove(position, yaw) {
    const client = this.bot.client;
    if (!client) return;

    this.position = { ...position };
    this.yaw = yaw;

    const runtimeIdBigInt = this.bot.selfRuntimeIdBigInt;
    if (runtimeIdBigInt == null) {
      logger.warn('Bewegung übersprungen: Runtime-ID unbekannt.');
      return;
    }

    try {
      this.sequence += 1n;
      client.queue('move_player', {
        runtime_id: runtimeIdBigInt,
        position,
        pitch: this.pitch,
        yaw,
        head_yaw: yaw,
        mode: 0,
        on_ground: true,
        riding_eid: 0n,
        tick: this.sequence,
        teleportation_cause: 0,
        teleportation_source_entity_type: 0
      });
    } catch (err) {
      logger.error(`Bewegungspaket konnte nicht gesendet werden: ${err.message}`);
    }
  }
}
