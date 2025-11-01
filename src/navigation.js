import { logger } from './logger.js';

export class NavigationManager {
  constructor(bot) {
    this.bot = bot;
    this.activePath = null;
    this.followTarget = null;
    this.arrivalTolerance = bot.config.navigationTolerance ?? 1.25;
  }

  setFollowTarget(playerName) {
    this.followTarget = playerName;
    this.activePath = null;
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
    const movement = this.bot.movement;
    if (!movement) return;

    if (this.followTarget) {
      const player = this.bot.getTrackedPlayer(this.followTarget);
      if (player?.position) {
        const arrived = movement.moveTowards(player.position, this.bot.config.followRange ?? 2);
        if (arrived) {
          logger.debug(`Bei ${this.followTarget} angekommen.`);
        }
      } else {
        logger.debug(`Spieler ${this.followTarget} nicht sichtbar.`);
      }
    }

    if (this.activePath) {
      const arrived = movement.moveTowards(this.activePath, this.arrivalTolerance);
      if (arrived) {
        logger.info(`Ziel ${this.activePath.name ?? 'Koordinate'} erreicht.`);
        this.activePath = null;
        this.bot.tasks.completeTask('navigate');
      }
    }
  }
}
