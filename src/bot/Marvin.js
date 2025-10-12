import { createClient } from 'bedrock-protocol';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { parseWhisper, buildWhisper } from '../utils/chat.js';
import { WorldState } from './WorldState.js';
import { MovementController } from './MovementController.js';
import { InteractionController } from './InteractionController.js';
import { ToolManager } from '../inventory/ToolManager.js';
import { BlockScanner } from './BlockScanner.js';
import { Scheduler } from './Scheduler.js';
import { TaskRunner } from '../tasks/TaskRunner.js';
import { FollowTask } from '../tasks/FollowTask.js';
import { GatherWoodTask } from '../tasks/GatherWoodTask.js';
import { ClearTask } from '../tasks/ClearTask.js';
import { DefendTask } from '../tasks/DefendTask.js';
import { AttackTask } from '../tasks/AttackTask.js';
import { BuildTask } from '../tasks/BuildTask.js';
import { CommandRouter } from '../commands/CommandRouter.js';
import blueprints from '../blueprints.json' assert { type: 'json' };

export class Marvin {
  constructor(customConfig = {}) {
    this.config = { ...config, ...customConfig };
    this.worldState = new WorldState();
    this.toolManager = new ToolManager();
    this.scheduler = new Scheduler();
    this.taskRunner = null;
    this.commandRouter = null;
  }

  async start() {
    this.client = createClient({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      offline: this.config.offline,
      authTitle: this.config.authTitle,
      version: this.config.version ?? '1.20.0'
    });

    this.#bindClient();
    this.movement = new MovementController(this.client, this.worldState, {
      speed: 0.14
    });
    this.interaction = new InteractionController(this.client, this.worldState, this.toolManager);
    this.scanner = new BlockScanner(this.worldState);

    const feedback = (message) => this.#sendWhisper(message);
    const context = this.#createContext({ feedback });
    this.taskRunner = new TaskRunner(context, this.config.movement.tickRate);

    this.taskRunner.register(new FollowTask(context));
    this.taskRunner.register(new GatherWoodTask(context));
    this.taskRunner.register(new ClearTask(context));
    this.taskRunner.register(new DefendTask(context));
    this.taskRunner.register(new AttackTask(context));
    this.taskRunner.register(new BuildTask(context));

    this.commandRouter = new CommandRouter(
      this.taskRunner,
      feedback,
      this.worldState,
      this.config.masterPlayer
    );
    blueprints.forEach((bp) => this.commandRouter.registerBlueprint(bp.name, bp));

    this.client.on('disconnect', (packet) => {
      logger.warn(`Disconnected: ${packet.message}`);
      this.scheduler.clearAll();
      this.taskRunner.stopActive('disconnect');
    });

    logger.info('Marvin initialisiert.');
  }

  #bindClient() {
    this.client.on('start_game', (packet) => {
      this.worldState.updateSelf({
        runtimeId: packet.runtime_entity_id,
        position: packet.player_position,
        rotation: { yaw: packet.rotation?.yaw ?? 0, pitch: packet.rotation?.pitch ?? 0 }
      });
      logger.info('Spiel gestartet.');
    });

    this.client.on('move_player', (packet) => {
      if (packet.runtime_id === this.worldState.self.runtimeId) {
        this.worldState.updateSelf({
          position: packet.position,
          rotation: { yaw: packet.yaw, pitch: packet.pitch }
        });
      } else if (packet.runtime_id != null) {
        const playerName = this.worldState.playerRuntimeLookup.get(packet.runtime_id);
        if (playerName) {
          this.worldState.updatePlayer(playerName, { position: packet.position });
        } else {
          this.worldState.updateEntity(packet.runtime_id, { position: packet.position });
        }
      }
    });

    this.client.on('set_entity_data', (packet) => {
      const { runtime_entity_id: id, metadata } = packet;
      if (id === this.worldState.self.runtimeId) return;
      const name = metadata?.find?.((entry) => entry.key === 'NAMETAG')?.value;
      const family = metadata?.find?.((entry) => entry.key === 'ENTITY_TYPE')?.value;
      this.worldState.updateEntity(id, { runtimeId: id, name, family });
    });

    this.client.on('add_player', (packet) => {
      this.worldState.updatePlayer(packet.username, {
        name: packet.username,
        runtimeId: packet.runtime_id,
        position: packet.position
      });
    });

    this.client.on('player_list', (packet) => {
      if (packet.records?.records?.length) {
        packet.records.records.forEach((record) => {
          if (record.username) {
            this.worldState.updatePlayer(record.username, {
              name: record.username,
              uuid: record.uuid
            });
          }
        });
      }
    });

    this.client.on('inventory_content', (packet) => {
      if (packet.window_id === 'inventory') {
        this.worldState.self.inventory = packet.contents;
        this.toolManager.refreshInventory(packet.contents);
      }
    });

    this.client.on('inventory_slot', (packet) => {
      if (packet.window_id === 'inventory') {
        this.worldState.self.inventory[packet.slot] = packet.item;
        this.toolManager.refreshInventory(this.worldState.self.inventory);
      }
    });

    this.client.on('update_block', (packet) => {
      const position = packet.position;
      const id = packet.block_runtime_id;
      if (id === 0 || id === 'minecraft:air') {
        this.scanner.removeBlock(position);
        return;
      }
      const blockState = { name: typeof id === 'string' ? id : String(id) };
      this.scanner.upsertBlock(position, blockState);
    });

    this.client.on('text', (packet) => this.#handleText(packet));
  }

  #handleText(packet) {
    if (this.config.enableChatLogging) {
      logger.info(`Chat[${packet.type}] ${packet.source_name}: ${packet.message}`);
    }

    if (packet.type !== 'whisper') return;
    const command = parseWhisper({ sender: packet.source_name, message: packet.message }, this.config.masterPlayer, this.config.username);
    if (!command) return;
    const handled = this.commandRouter.handle(command);
    if (!handled) {
      this.#sendWhisper('❌ Befehl fehlgeschlagen.');
    }
  }

  #sendWhisper(message) {
    this.client.queue('command_request', {
      command: buildWhisper(this.config.masterPlayer, message),
      origin: { type: 0 }
    });
  }

  #createContext(overrides = {}) {
    return {
      config: this.config,
      worldState: this.worldState,
      masterName: this.config.masterPlayer,
      movement: this.movement,
      interaction: this.interaction,
      scanner: this.scanner,
      scheduler: this.scheduler,
      feedback: (msg) => this.#sendWhisper(msg),
      ...overrides
    };
  }
}
