const COMMANDS = [
  {
    type: 'collect',
    regex: /^samm(el|le)\s+(\d+)\s+(.+)$/i,
    map: (match) => ({ count: Number(match[2]), item: match[3].trim() })
  },
  {
    type: 'rememberLocation',
    regex: /^merk\s*dir\s+(.+)$/i,
    map: (match) => ({ name: match[1].trim() })
  },
  {
    type: 'follow',
    regex: /^folg\s*mir(\s*bitte)?$/i,
    map: () => ({})
  },
  {
    type: 'navigate',
    regex: /^geh\s*nach\s+(.+)$/i,
    map: (match) => ({ target: match[1].trim() })
  },
  {
    type: 'attackPlayer',
    regex: /^kämp(f|fe)\s*gegen\s+(.+)$/i,
    map: (match) => ({ target: match[2].trim() })
  },
  {
    type: 'setSpawn',
    regex: /^set(\s*spawnpoint)?$/i,
    map: () => ({})
  },
  {
    type: 'sleep',
    regex: /^geh\s*schlaf(en)?$/i,
    map: () => ({})
  },
  {
    type: 'status',
    regex: /^status$/i,
    map: () => ({})
  },
  {
    type: 'stop',
    regex: /^stopp$/i,
    map: () => ({})
  },
  {
    type: 'listLocations',
    regex: /^liste\s+orte$/i,
    map: () => ({})
  },
  {
    type: 'deleteLocation',
    regex: /^lösche\s+ort\s+(.+)$/i,
    map: (match) => ({ name: match[1].trim() })
  }
];

export function parseCommand(message) {
  const normalized = message.trim();
  for (const command of COMMANDS) {
    const match = normalized.match(command.regex);
    if (match) {
      return { type: command.type, ...command.map(match) };
    }
  }
  return { type: 'unknown', raw: normalized };
}

export function normalizeName(name) {
  return name.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
