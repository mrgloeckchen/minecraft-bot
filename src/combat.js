import { logger } from './logger.js';

export class CombatManager {
  constructor(bot, toolManager) {
    this.bot = bot;
    this.toolManager = toolManager;
    this.target = null;
  }

  engagePlayer(playerName) {
    this.target = { type: 'player', name: playerName };
    const loadout = this.toolManager.getCombatLoadout();
    logger.info(`Greife ${playerName} mit ${loadout.melee?.id ?? 'Faust'} an.`);
    // Hier würden Attack-Pakete gesendet
  }

  engageMob(entityId, entityType) {
    this.target = { type: 'mob', entityId, entityType };
    const loadout = this.toolManager.getCombatLoadout();
    logger.info(`Greife Mob ${entityType} (${entityId}) an.`);
  }

  holdShield(active) {
    if (active) {
      logger.debug('Schild wird gehoben.');
    } else {
      logger.debug('Schild wird gesenkt.');
    }
  }

  clearTarget() {
    if (this.target) {
      logger.info(`Kampf gegen ${this.target.name ?? this.target.entityType} beendet.`);
    }
    this.target = null;
  }
}
