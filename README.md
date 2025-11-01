# 🧠 gloeckchende – Der intelligente Minecraft-Bedrock-Bot

Ein vollwertiger **Bedrock-Spielerbot** auf Basis von **PrismarineJS / bedrock-protocol**, der sich auf deinem Server wie ein echter Spieler verhält. Er versteht **deutsche Befehle**, führt Aufgaben selbstständig aus, merkt sich Orte und reagiert auf Zonen, Spieler und Mobs.

---

## ⚙️ 1. Steuerung über Chat

*gloeckchende* reagiert ausschließlich auf **private Nachrichten** (Whispers):

```
/msg gloeckchende <Befehl>
```

### 🔤 Beispiele für Befehle

| Befehl | Funktion | Beispiel |
| --- | --- | --- |
| `sammel <Anzahl> <Item>` | Sammelt oder farmt Items und craftet sie bei Bedarf | `/msg gloeckchende sammel 64 Eichenbretter` |
| `merk dir <Name>` | Merkt sich den aktuellen Standort unter einem Namen | `/msg gloeckchende merk dir Zuhause` |
| `folg mir` | Folgt dem Spieler im Umkreis von 5×5 Blöcken | `/msg gloeckchende folg mir` |
| `geh nach <Ort/Spieler/Koordinaten>` | Geht zu einem gemerkten Ort, Spieler oder Koordinaten | `/msg gloeckchende geh nach Schlumpfine` |
| `kämpf gegen <Spieler>` | Greift den angegebenen Spieler an | `/msg gloeckchende kämpf gegen mrgloeckchen` |
| `set spawnpoint` | Sucht das nächste Bett, legt sich rein und setzt den Spawn | `/msg gloeckchende set spawnpoint` |
| `geh schlafen` | Geht schlafen, sobald möglich | `/msg gloeckchende geh schlafen` |
| `status` | Zeigt aktuelle Aufgaben, Position, Toolstatus etc. | `/msg gloeckchende status` |
| `stopp` | Bricht die aktuelle Aufgabe ab | `/msg gloeckchende stopp` |
| `liste orte` | Listet alle gespeicherten Orte | `/msg gloeckchende liste orte` |
| `lösche ort <Name>` | Löscht einen gespeicherten Ort | `/msg gloeckchende lösche ort Zuhause` |

---

## 🪓 2. Intelligente Werkzeugwahl

*gloeckchende* nutzt nicht mehr nur Slot 1, sondern entscheidet selbst, welches Werkzeug optimal ist – inklusive Crafting, Haltbarkeit und Verzauberungen.

### 🧩 Werkzeug-Logik

1. **Blockanalyse** – erkennt Typ (z. B. Stein, Holz, Erde, Erz, Pflanze, Mob).
2. **Bestes Werkzeug wählen**
   * Stein / Erze → Spitzhacke
   * Holz / Stämme → Axt
   * Erde / Sand / Schnee → Schaufel
   * Pflanzen / Saatgut → Hacke
   * Kampf → Schwert (Nah), Bogen (Fern)
   * Spezialfälle: Schere für Blätter/Wolle
3. **Tier-Check (Materialstufe)**
   * Stein ≥ Holz
   * Eisen ≥ Stein
   * Diamant ≥ Eisen
   * Netherit ≥ Diamant (z. B. Obsidian nur mit Diamant)
4. **Verzauberungen berücksichtigen** – Effizienz, Schärfe, Glück, Haltbarkeit usw.
5. **Haltbarkeit prüfen** – ist sie zu niedrig, wird das nächstbeste Tool gewählt oder gecraftet.

### ⚒️ Crafting bei Bedarf

Fehlt das passende Werkzeug, baut *gloeckchende* automatisch Rohstoffe ab und craftet sich das Werkzeug selbst (z. B. Holz → Bretter → Sticks → Steinspitzhacke).

### ⚔️ Kampf-Werkzeuge

* Gegneranalyse: Spieler, Mob-Typ, Distanz
* Nahkampf → Schwert oder Axt (je nach Schaden/Verzauberung)
* Fernkampf → Bogen, Armbrust oder Dreizack (Riptide/Loyalty)
* Schild wird aktiv genutzt, wenn vorhanden

---

## 🧭 3. Navigation & Bewegung

### 🧍‍♂️ Folgen (5×5-Umkreis)

* *gloeckchende* hält sich in einem **5×5-Blöcke**-Umkreis um den Spieler auf (Chebyshev-Distanz ≤ 2).
* Ist der Abstand zu groß, pfadfindet er zu dir.
* Er springt über Blöcke, vermeidet Stürze und respektiert Hindernisse.

### 📍 Navigation

* **Gemerkte Orte** – geht zu gespeicherten Koordinaten.
* **Spieler** – läuft zur letzten bekannten Position.
* **Koordinaten** – bewegt sich zu beliebigen (x, y, z).
* Erkennt Hindernisse und weicht automatisch aus.

---

## 🗺️ 4. Orte & Zonen

### 📌 Orte merken

```
/msg gloeckchende merk dir Zuhause
```

Speichert die aktuelle Position in `locations.json`.

```json
{
  "Zuhause": {"x": -15, "y": 64, "z": 88, "dimension": "overworld", "created_by": "Deniz"}
}
```

### 📜 Zonen (`data/locations.txt`)

Überwacht festgelegte Gebiete und reagiert auf Eindringlinge.

```
Deniz-Insel=-120,80;-60,140
Farm-Nord=200,-50;260,10
```

Wenn ein Spieler eine Zone betritt, erscheint z. B. die Meldung:

> „Schlumpfine hat **Deniz-Insel** betreten (−85, 92).“

---

## 🛡️ 5. Verteidigung & Kampf

### 🧍‍♂️ Spielerverteidigung

* Bei aktiver Verteidigung werden **nicht-whitelistete Spieler** angegriffen, sobald sie geschützte Zonen betreten.
* Whitelist (`whitelist.json`):

```json
{ "players": ["Deniz", "Schlumpfine"] }
```

### 👾 Mobverteidigung

* Greift nur feindliche Mobs (Zombie, Skelett, Creeper, Enderman etc.) an.
* Friedliche Tiere werden ignoriert.
* Greift aktiv an, wenn sich ein Mob in einer Verteidigungszone oder im definierten Radius befindet.

---

## 💤 6. Schlafen & Spawn

### 🛏️ `set spawnpoint`

* Sucht in einem Umkreis (z. B. 32 Blöcke) das nächste Bett.
* Geht hin, legt sich kurz rein und setzt so den Spawnpoint.

### 🌙 `geh schlafen`

* Erkennt Nacht oder Regen.
* Geht zum nächsten Bett und legt sich schlafen.
* Bleibt liegen, bis es wieder Tag ist.

---

## 📂 7. Dateistruktur

```
project/
├─ bot.js
├─ package.json
├─ data/
│  ├─ locations.json
│  ├─ locations.txt
│  ├─ items.de.json
│  ├─ min_tier.json
│  ├─ whitelist.json
│  ├─ tool_alias.de.json
│  └─ combat_prefs.json
└─ config.json
```

### `config.json`

```json
{
  "autoCraftTools": true,
  "lowDurabilityThreshold": 10,
  "preferSwordInBedrock": true,
  "useShield": true,
  "defenseZonesEnabled": true,
  "zoneCheckInterval": 2,
  "followRange": 2,
  "mobDefenseRadius": 15
}
```

---

## 💬 8. Rückmeldungen (Deutsch)

* „Okay, ich sammle **64 Eichenbretter**. Aktuell: **32 / 64**.“
* „Ort **Zuhause** wurde gespeichert: (−15, 64, 88).“
* „Ich folge dir. Bleibe im **5×5-Umkreis**.“
* „Unterwegs nach **Schlumpfine** …“
* „Kämpfe gegen **mrglöckchen**! 🔪“
* „Spawnpoint gesetzt.“
* „Kein Bett in Reichweite gefunden.“
* „**Schlumpfine** hat **Deniz-Insel** betreten! 🏝️“
* „Verteidige **Deniz-Insel** gegen Eindringlinge! ⚔️“

---

## 🧮 9. Interner Parser (Deutsch)

*gloeckchende* versteht umgangssprachlich geschriebene Befehle. Beispiel-Regeln:

| Aktion | Regex |
| --- | --- |
| Sammeln | `^samm(el|le)\s+(\d+)\s+(.+)$` |
| Ort merken | `^merk\s*dir\s+(.+)$` |
| Folgen | `^folg\s*mir$` |
| Navigation | `^geh\s*nach\s+(.+)$` |
| Kampf | `^kämp(f|fe)\s*gegen\s+(.+)$` |
| Spawnpoint | `^set(\s*spawnpoint)?$` |
| Schlafen | `^geh\s*schlaf(en)?$` |

Er erkennt auch Varianten wie „kämpfe“, „geh schlafen“, „folg mir bitte“ usw.

---

## 🧩 10. Bedrock-spezifische Umsetzung

* Nutzt **PrismarineJS / bedrock-protocol** (neueste Version).
* Authentifiziert über Microsoft-Login oder `deviceToken`.
* Verwendet native Bedrock-Events (`move`, `block_update`, `inventory_update`).
* Tick-Loops (z. B. Zonenprüfung, Sammelaufgaben) laufen asynchron.
* API-kompatibel mit aktuellen Bedrock-Servern (getestet mit 1.21.93).

---

## 🚀 11. Zukunfts-Erweiterungen

* 🧠 Chat-KI für freie Konversation („gloeckchende, wie läuft’s?“)
* 📦 Automatische Lagerverwaltung (Kistensortierung)
* 🛠️ Tool-Reparatur via Amboss oder Crafting
* 🐷 Tier-Management (Kühe füttern, Leinen prüfen)
* 🌾 Farmzyklen / Redstone-Schaltungen auslösen
* 🔗 Integration mit Jarvis-Dashboard (Statusanzeige, Steuerung per Sprache)

---

## ▶️ 12. Installation & Start

1. Node.js (>= 18) installieren.
2. Repository clonen und Abhängigkeiten installieren:

   ```bash
   npm install
   ```

3. Zugangsdaten in `config.json` eintragen (Host, Port, Auth-Methode etc.).
4. Bot starten:

   ```bash
   npm start
   ```

Beim ersten Start legt der Bot automatisch alle benötigten Dateien im Ordner `data/` an und lädt die Zonen- sowie Whitelist-Konfiguration.

