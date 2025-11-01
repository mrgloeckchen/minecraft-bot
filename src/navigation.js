import { logger } from './logger.js';

export class NavigationManager {
  constructor(bot) {
    this.bot = bot;
    this.activePath = null;
    this.followTarget = null;
  }

  setFollowTarget(playerName) {
    this.followTarget = playerName;
    logger.info(`Folge ${playerName}.`);
  }

  clearFollow() {
    this.followTarget = null;
    logger.info('Folgen gestoppt.');
  }

  navigateTo(position) {
    this.activePath = position;
    logger.info(`Navigiere zu ${JSON.stringify(position)}.`);
    // In echter Implementierung hier Pathfinder ansteuern
  }

  tick() {
    if (this.followTarget) {
      // Hier würde man die aktuelle Spielerposition auslesen
      logger.debug(`Halte Abstand zu ${this.followTarget}.`);
    }
    if (this.activePath) {
      logger.debug(`Pfad aktiv: ${JSON.stringify(this.activePath)}.`);
    }
  }
}
