import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export class DataStore {
  constructor(baseDir) {
    this.baseDir = path.resolve(__dirname, '..', baseDir);
    ensureDir(this.baseDir);
  }

  getPath(name) {
    return path.join(this.baseDir, name);
  }

  readJson(name, fallback = {}) {
    const filePath = this.getPath(name);
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
        return fallback;
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (err) {
      logger.error(`Fehler beim Lesen von ${name}: ${err.message}`);
      return fallback;
    }
  }

  writeJson(name, data) {
    const filePath = this.getPath(name);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      logger.error(`Fehler beim Schreiben von ${name}: ${err.message}`);
    }
  }

  readLines(name) {
    const filePath = this.getPath(name);
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('#'));
    } catch (err) {
      logger.error(`Fehler beim Lesen von ${name}: ${err.message}`);
      return [];
    }
  }
}
