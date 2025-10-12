import { logger } from '../utils/logger.js';

const toYaw = (dx, dz) => {
  const yaw = Math.atan2(-dx, -dz);
  return (yaw * 180) / Math.PI;
};

export class MovementController {
  constructor(client, worldState, options = {}) {
    this.client = client;
    this.worldState = worldState;
    this.speed = options.speed ?? 0.1;
  }

  get position() {
    return this.worldState.self.position;
  }

  moveTowards(targetPosition, { stopDistance = 1.5, speed = this.speed } = {}) {
    const current = this.position;
    if (!current || !targetPosition) return;
    const dx = targetPosition.x - current.x;
    const dy = targetPosition.y - current.y;
    const dz = targetPosition.z - current.z;
    const distanceSq = dx ** 2 + dy ** 2 + dz ** 2;
    if (distanceSq <= stopDistance ** 2) {
      this.stop();
      return true;
    }
    const distance = Math.sqrt(distanceSq);
    const nx = dx / distance;
    const ny = dy / distance;
    const nz = dz / distance;
    const velocity = { x: nx * speed, y: ny * speed, z: nz * speed };
    this.#sendMotion(velocity, toYaw(dx, dz));
    return false;
  }

  stop() {
    this.#sendMotion({ x: 0, y: 0, z: 0 }, this.worldState.self.rotation?.yaw ?? 0);
  }

  jump() {
    this.#sendMotion({ x: 0, y: 0.42, z: 0 }, this.worldState.self.rotation?.yaw ?? 0);
  }

  lookAt(target) {
    const current = this.position;
    if (!current) return;
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const dz = target.z - current.z;
    const yaw = toYaw(dx, dz);
    const pitch = (Math.atan2(dy, Math.sqrt(dx ** 2 + dz ** 2)) * 180) / Math.PI;
    this.client.queue('move_player', {
      runtime_id: this.worldState.self.runtimeId,
      position: current,
      pitch,
      yaw,
      head_yaw: yaw,
      mode: 0,
      on_ground: true,
      tick: BigInt(Date.now())
    });
  }

  #sendMotion(velocity, yaw) {
    try {
      this.client.queue('set_entity_motion', {
        runtime_id: this.worldState.self.runtimeId,
        velocity
      });
      const pos = this.position ?? { x: 0, y: 0, z: 0 };
      const nextPos = { x: pos.x + velocity.x, y: pos.y + velocity.y, z: pos.z + velocity.z };
      this.worldState.updateSelf({ position: nextPos, rotation: { yaw, pitch: this.worldState.self.rotation?.pitch ?? 0 } });
      this.client.queue('move_player', {
        runtime_id: this.worldState.self.runtimeId,
        position: nextPos,
        pitch: this.worldState.self.rotation?.pitch ?? 0,
        yaw,
        head_yaw: yaw,
        mode: 0,
        on_ground: true,
        tick: BigInt(Date.now())
      });
    } catch (error) {
      logger.error('Failed to send movement packet', error);
    }
  }
}
