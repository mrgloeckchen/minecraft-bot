import { logger } from '../utils/logger.js';

const commandAliases = {
  follow: ['folg'],
  gather: ['hol'],
  clear: ['clear'],
  defend: ['verteidige'],
  attack: ['kill'],
  build: ['build'],
  stop: ['stop']
};

const matchCommand = (command) => {
  const normalized = command.toLowerCase();
  return Object.entries(commandAliases).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null;
};

export class CommandRouter {
  constructor(taskRunner, feedback, worldState, masterName) {
    this.taskRunner = taskRunner;
    this.feedback = feedback;
    this.worldState = worldState;
    this.masterName = masterName;
    this.blueprints = new Map();
  }

  registerBlueprint(name, structure) {
    this.blueprints.set(name.toLowerCase(), structure);
  }

  handle(commandText) {
    if (!commandText) return false;
    const [rawCommand, ...rest] = commandText.trim().split(/\s+/);
    const command = matchCommand(rawCommand);
    if (!command) {
      this.feedback(`❓ Unbekannter Befehl: ${rawCommand}`);
      return false;
    }
    switch (command) {
      case 'follow':
        return this.taskRunner.start('follow', {});
      case 'gather': {
        const [amount = '0', ...typeParts] = rest;
        const quantity = Number.parseInt(amount, 10) || 0;
        const woodType = typeParts.join(' ');
        if (!woodType) {
          this.feedback('🪵 Bitte Holztyp angeben.');
          return false;
        }
        return this.taskRunner.start('gather_wood', { quantity, woodType });
      }
      case 'clear': {
        if (rest.length < 6) {
          this.feedback('🧹 Nutzung: Clear <x1 y1 z1 x2 y2 z2>');
          return false;
        }
        const coords = rest.map((value) => Number.parseInt(value, 10));
        if (coords.some(Number.isNaN)) {
          this.feedback('📐 Ungültige Koordinaten.');
          return false;
        }
        const [x1, y1, z1, x2, y2, z2] = coords;
        return this.taskRunner.start('clear', { x1, y1, z1, x2, y2, z2 });
      }
      case 'defend':
        return this.taskRunner.start('defend', {});
      case 'attack': {
        const target = rest[0];
        if (!target) {
          this.feedback('⚔️ Bitte Spielername angeben.');
          return false;
        }
        return this.taskRunner.start('attack', { target });
      }
      case 'build': {
        const blueprintName = rest[0]?.toLowerCase();
        if (!blueprintName || !this.blueprints.has(blueprintName)) {
          this.feedback('🏗️ Blueprint nicht gefunden.');
          return false;
        }
        const blueprint = this.blueprints.get(blueprintName);
        const master = this.worldState.players.get(this.masterName);
        const origin = master?.position ? {
          x: Math.floor(master.position.x),
          y: Math.floor(master.position.y),
          z: Math.floor(master.position.z)
        } : { x: 0, y: 0, z: 0 };
        return this.taskRunner.start('build', { blueprint, origin });
      }
      case 'stop':
        this.taskRunner.stopActive('manual');
        this.feedback('⛔ Aufgabe gestoppt.');
        return true;
      default:
        logger.warn(`Unhandled command ${command}`);
        return false;
    }
  }
}
