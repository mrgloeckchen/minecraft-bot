import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { createClient } from 'bedrock-protocol';
import { logger } from './src/logger.js';
import { parseCommand } from './src/commandParser.js';
import { DataStore } from './src/storage.js';
import { InventoryManager } from './src/inventory.js';
import { ToolManager } from './src/toolManager.js';
import { NavigationManager } from './src/navigation.js';
import { CombatManager } from './src/combat.js';
import { TaskManager } from './src/taskManager.js';
import { ZoneManager } from './src/zones.js';
import { LocationManager } from './src/locations.js';
import { MovementController } from './src/movement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadConfig() {
  const filePath = path.join(__dirname, 'config.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function normalizeRuntimeId(value) {
  if (value == null) return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  if (typeof value === 'bigint') {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    const numeric = Number(trimmed);
    if (Number.isSafeInteger(numeric)) return numeric;

    try {
      const bigintValue = BigInt(trimmed);
      const asNumber = Number(bigintValue);
      return Number.isSafeInteger(asNumber) ? asNumber : null;
    } catch {
      return null;
    }
  }

  return null;
}

function runtimeIdToKey(value) {
  if (value == null) return null;

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return Math.trunc(value).toString();
  }

  if (typeof value === 'string') {
    return value.trim() === '' ? null : value;
  }

  try {
    return value.toString();
  } catch {
    return null;
  }
}

export class GloeckchendeBot extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.client = null;
    this.store = new DataStore(config.dataDirectory || 'data');
    this.inventory = new InventoryManager();
    this.toolManager = new ToolManager(this.inventory, config);
    this.movement = new MovementController(this);
    this.navigation = new NavigationManager(this);
    this.combat = new CombatManager(this, this.toolManager);
    this.tasks = new TaskManager(this);
    this.zones = new ZoneManager(this.store);
    this.locations = new LocationManager(this.store);
    this.position = { x: 0, y: 0, z: 0, dimension: 'overworld' };
    this.tickInterval = null;
    this.username = config.username;
    this.selfRuntimeId = null;
    this.selfRuntimeIdKey = null;
    this.players = new Map();
  }

  connect() {
    logger.info('Starte Verbindung zum Server ...');
    this.client = createClient(this.config);
    this.bindEvents();
    this.zones.load();
    this.locations.load();
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  bindEvents() {
    this.client.on('start_game', (packet) => {
      const rawRuntimeId =
        packet.runtime_entity_id ?? packet.runtime_id ?? packet.player_id ?? null;
      this.selfRuntimeId = normalizeRuntimeId(rawRuntimeId);
      this.selfRuntimeIdKey = runtimeIdToKey(rawRuntimeId);
      if (this.selfRuntimeId == null) {
        logger.warn('Konnte keine gültige Runtime-ID bestimmen.');
      }
      this.position = {
        x: packet.player_position.x,
        y: packet.player_position.y,
        z: packet.player_position.z,
        dimension: 'overworld'
      };
      this.movement.initializeFromStartGame(packet);
      logger.info('Startpaket empfangen.');
    });

    this.client.on('join', () => {
      logger.info('Mit Server verbunden.');
    });

    this.client.on('text', (packet) => {
      if (packet.type !== 'whisper') return;
      const sender = packet.source_name ?? packet.sender ?? packet.name ?? 'Unbekannt';
      if (sender === this.username) return;
      const command = parseCommand(packet.message);
      logger.info(`Befehl von ${sender}: ${packet.message} → ${command.type}`);
      this.handleCommand(sender, command);
    });

    this.client.on('move_player', (packet) => {
      const position = {
        x: packet.position.x,
        y: packet.position.y,
        z: packet.position.z,
        dimension: this.position.dimension
      };

      const runtimeIdKey = runtimeIdToKey(packet.runtime_id);
      const isSelfPacket =
        (runtimeIdKey && this.selfRuntimeIdKey && runtimeIdKey === this.selfRuntimeIdKey) ||
        packet.runtime_id === undefined;

      if (isSelfPacket) {
        this.position = position;
        this.movement.updateServerPosition(position);
        this.emit('position', this.position);
      } else if (runtimeIdKey) {
        this.updateTrackedPlayer(runtimeIdKey, position);
      }
    });

    this.client.on('tick_sync', (packet) => {
      try {
        this.client.queue('tick_sync', {
          request_time: packet.response_time,
          response_time: packet.response_time
        });
      } catch (err) {
        logger.warn(`Tick-Sync fehlgeschlagen: ${err.message}`);
      }
    });

    this.client.on('add_player', (packet) => {
      const runtimeIdKey = runtimeIdToKey(
        packet.runtime_id ?? packet.runtime_entity_id ?? packet.entity_id
      );
      if (!runtimeIdKey) return;

      this.players.set(runtimeIdKey, {
        name: packet.username,
        uuid: packet.uuid,
        position: packet.position
      });
      logger.debug(`Spieler ${packet.username} hinzugefügt.`);
    });

    this.client.on('remove_player', (packet) => {
      for (const runtimeId of packet.runtime_entity_ids || []) {
        const runtimeIdKey = runtimeIdToKey(runtimeId);
        if (!runtimeIdKey) continue;
        const player = this.players.get(runtimeIdKey);
        if (player) {
          logger.debug(`Spieler ${player.name} entfernt.`);
        }
        this.players.delete(runtimeIdKey);
      }
    });

    this.client.on('inventory_content', (packet) => {
      this.inventory.applyInventory(packet.inventory);
    });

    this.client.on('level_event', (packet) => {
      if (packet.eventId === 'bed_enter') {
        logger.info('Im Bett. Spawn wird gesetzt.');
      }
    });

    this.client.on('error', (err) => {
      logger.error(`Fehler vom Client: ${err.message}`);
    });

    this.client.on('close', () => {
      logger.warn('Verbindung geschlossen.');
      clearInterval(this.tickInterval);
    });
  }

  sendPrivateMessage(target, message) {
    logger.info(`→ ${target}: ${message}`);
    this.client.queue('text', {
      type: 'whisper',
      needs_translation: false,
      source_name: this.username,
      xuid: '',
      platform_chat_id: '',
      message: message,
      filtered_message: '',
      translation_parameters: [],
      target_name: target
    });
  }

  handleCommand(sender, command) {
    switch (command.type) {
      case 'collect':
        this.tasks.setTask({
          type: 'collect',
          item: command.item,
          count: command.count,
          requestedBy: sender
        });
        this.sendPrivateMessage(sender, `Okay, ich sammle ${command.count} ${command.item}.`);
        break;
      case 'rememberLocation':
        this.locations.remember(command.name, this.position, sender);
        this.sendPrivateMessage(
          sender,
          `Ort ${command.name} gespeichert: (${Math.round(this.position.x)}, ${Math.round(this.position.y)}, ${Math.round(this.position.z)}).`
        );
        break;
      case 'follow':
        this.navigation.setFollowTarget(sender);
        this.tasks.setTask({ type: 'follow', requestedBy: sender });
        this.sendPrivateMessage(sender, 'Ich folge dir.');
        break;
      case 'navigate': {
        const location = this.locations.find(command.target);
        if (location) {
          this.navigation.clearFollow();
          this.navigation.navigateTo(location);
          this.tasks.setTask({ type: 'navigate', target: location, requestedBy: sender });
          this.sendPrivateMessage(sender, `Unterwegs nach ${location.name}.`);
        } else {
          this.sendPrivateMessage(sender, `Ich kenne ${command.target} nicht.`);
        }
        break;
      }
      case 'attackPlayer':
        this.combat.engagePlayer(command.target);
        this.sendPrivateMessage(sender, `Kämpfe gegen ${command.target}!`);
        break;
      case 'setSpawn':
        this.sendPrivateMessage(sender, 'Ich suche ein Bett in der Nähe.');
        // Hier würde Pathfinding zu Bett erfolgen
        break;
      case 'sleep':
        this.sendPrivateMessage(sender, 'Ich gehe schlafen, sobald es möglich ist.');
        break;
      case 'status':
        this.reportStatus(sender);
        break;
      case 'stop':
        this.tasks.clearTask('abgebrochen');
        this.navigation.clearFollow();
        this.combat.clearTarget();
        this.sendPrivateMessage(sender, 'Alles klar, ich halte an.');
        break;
      case 'listLocations': {
        const list = this.locations.list();
        if (list.length === 0) {
          this.sendPrivateMessage(sender, 'Keine Orte gespeichert.');
        } else {
          const lines = list
            .map((loc) => `${loc.name} (${Math.round(loc.x)}, ${Math.round(loc.y)}, ${Math.round(loc.z)})`)
            .join(', ');
          this.sendPrivateMessage(sender, `Gespeicherte Orte: ${lines}`);
        }
        break;
      }
      case 'deleteLocation':
        if (this.locations.remove(command.name)) {
          this.sendPrivateMessage(sender, `Ort ${command.name} gelöscht.`);
        } else {
          this.sendPrivateMessage(sender, `Ort ${command.name} nicht gefunden.`);
        }
        break;
      default:
        this.sendPrivateMessage(sender, 'Diesen Befehl verstehe ich nicht.');
        break;
    }
  }

  reportStatus(target) {
    const task = this.tasks.activeTask;
    const message = [
      `Position: ${Math.round(this.position.x)}, ${Math.round(this.position.y)}, ${Math.round(this.position.z)}`,
      `Aktive Aufgabe: ${task ? task.type : 'keine'}`,
      `Werkzeug (Kampf): ${this.toolManager.getCombatLoadout().melee?.id ?? 'keins'}`,
      `Verteidigung: ${this.config.defenseZonesEnabled ? 'aktiv' : 'aus'}`
    ].join(' | ');
    this.sendPrivateMessage(target, message);
  }

  tick() {
    this.tasks.tick();
    this.navigation.tick();
    if (this.config.defenseZonesEnabled) {
      this.checkZones();
    }
  }

  getTrackedPlayer(name) {
    for (const [, player] of this.players) {
      if (player?.name?.toLowerCase() === name.toLowerCase()) {
        return player;
      }
    }
    return null;
  }

  updateTrackedPlayer(runtimeIdKey, position) {
    if (!runtimeIdKey) return;
    const entry = this.players.get(runtimeIdKey);
    if (!entry) return;
    entry.position = position;
  }

  checkZones() {
    for (const [, player] of this.players) {
      if (!player?.position || !player?.name) continue;
      const zone = this.zones.checkPlayerPosition(player.name, player.position);
      if (zone) {
        logger.warn(`${player.name} in Zone ${zone.name} entdeckt.`);
        this.emit('zoneIntrusion', { player, zone });
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const bot = new GloeckchendeBot(config);
  bot.connect();
}
