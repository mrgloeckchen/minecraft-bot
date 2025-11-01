'use strict';

/**
 * Coerces the provided value into a {@link BigInt}. The Bedrock protocol expects a couple of
 * movement related fields (runtime entity id, tick and frame id) to be encoded as varint64 values.
 * Node will throw "Cannot mix BigInt and other types" whenever a number is combined with a BigInt,
 * so we normalise everything here to avoid runtime crashes when packets are serialised.
 *
 * @param {bigint|number|string} value - The value coming from the server or internal state.
 * @param {string} name - Used for better error messages.
 * @returns {bigint}
 */
function ensureBigInt(value, name) {
  if (typeof value === 'bigint') {
    return value;
  }

  if (value === undefined || value === null || Number.isNaN(value)) {
    throw new TypeError(`${name} is required to build the packet but was ${value}`);
  }

  if (typeof value === 'number') {
    return BigInt(Math.trunc(value));
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return BigInt(value);
  }

  throw new TypeError(`Unsupported ${name} type: ${typeof value}`);
}

module.exports = { ensureBigInt };
