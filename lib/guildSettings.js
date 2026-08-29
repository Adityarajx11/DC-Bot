const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'guildSettings.json');

function loadAll() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save guild settings:', err.message);
  }
}

function getGuildSettings(guildId) {
  const all = loadAll();
  return all[guildId] || {};
}

function updateGuildSettings(guildId, patch) {
  const all = loadAll();
  all[guildId] = { ...(all[guildId] || {}), ...patch };
  saveAll(all);
  return all[guildId];
}

function getAllGuildSettings() {
  return loadAll();
}

function get247(guildId) {
  return getGuildSettings(guildId).stay247 || false;
}

function set247(guildId, value) {
  updateGuildSettings(guildId, { stay247: value });
}

module.exports = {
  getGuildSettings,
  updateGuildSettings,
  getAllGuildSettings,
  get247,
  set247,
};