'use strict';

// Where the paired instance's credentials live on disk.
//
// Windows: %APPDATA%\LaVerdiCompanion\config.json (the normal per-user app
// data location -- not Program Files, no admin rights needed).
// Anything else (used only for dev/testing this skeleton, e.g. in a Linux
// shell): ~/.laverdi-companion/config.json.
//
// Bones-stage note: this file holds a pairing token in plaintext. That's
// an accepted gap for the skeleton -- a real release should encrypt it at
// rest (DPAPI on Windows) before this goes to any actual customer.

const fs = require('fs');
const path = require('path');
const os = require('os');

function configDir() {
  if (process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'LaVerdiCompanion');
  }
  return path.join(os.homedir(), '.laverdi-companion');
}

function configPath() {
  return path.join(configDir(), 'config.json');
}

function load() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function save(config) {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true });
  const tmp = configPath() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(config, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, configPath());
}

module.exports = { load, save, configPath, configDir };
