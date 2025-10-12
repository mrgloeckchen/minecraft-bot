const keyFromPos = ({ x, y, z }) => `${Math.floor(x)}:${Math.floor(y)}:${Math.floor(z)}`;

export class BlockScanner {
  constructor(worldState) {
    this.worldState = worldState;
    this.blocks = new Map();
  }

  upsertBlock(position, blockState) {
    const key = keyFromPos(position);
    this.blocks.set(key, { position, blockState });
  }

  removeBlock(position) {
    const key = keyFromPos(position);
    this.blocks.delete(key);
  }

  findNearestBlock(predicate) {
    const current = this.worldState.self.position;
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    this.blocks.forEach((block) => {
      if (!predicate(block)) return;
      const dx = block.position.x - current.x;
      const dy = block.position.y - current.y;
      const dz = block.position.z - current.z;
      const distanceSq = dx ** 2 + dy ** 2 + dz ** 2;
      if (distanceSq < bestDistance) {
        best = {
          position: block.position,
          blockState: block.blockState,
          distanceSq
        };
        bestDistance = distanceSq;
      }
    });
    return best;
  }
}
