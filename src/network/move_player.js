'use strict';

const { ensureBigInt } = require('../utils/bigint');

/**
 * Builds a MovePlayer packet that is safe to send through bedrock-protocol.
 * All BigInt fields are normalised to avoid "Cannot mix BigInt and other types" errors.
 *
 * @param {object} params - High level representation of the move request.
 * @param {object} params.position - Position vector.
 * @param {number} params.position.x
 * @param {number} params.position.y
 * @param {number} params.position.z
 * @param {object} params.rotation - Rotation (yaw/pitch) values in degrees.
 * @param {number} params.rotation.yaw
 * @param {number} params.rotation.pitch
 * @param {number|bigint|string} params.runtimeId - Runtime entity id provided by the server.
 * @param {number|bigint|string} params.tick - Server tick counter.
 * @param {number|bigint|string} [params.frame] - Optional frame counter.
 * @param {object} [overrides] - Additional packet fields forwarded to bedrock-protocol.
 * @returns {object}
 */
function buildMovePlayerPacket(params, overrides = {}) {
  const runtimeId = ensureBigInt(params.runtimeId, 'runtimeId');
  const tick = ensureBigInt(params.tick, 'tick');
  const frame = params.frame !== undefined ? ensureBigInt(params.frame, 'frame') : undefined;

  const packet = {
    runtime_entity_id: runtimeId,
    position: params.position,
    pitch: params.rotation.pitch,
    yaw: params.rotation.yaw,
    head_yaw: params.rotation.headYaw ?? params.rotation.yaw,
    on_ground: params.onGround ?? true,
    mode: params.mode ?? 0,
    teleport: params.teleport ?? false,
    tick,
    ...overrides
  };

  if (frame !== undefined) {
    packet.frame = frame;
  }

  return packet;
}

module.exports = { buildMovePlayerPacket };
