const { pool } = require('./db');

// In-memory cache for fast lookups
let cache = {};

async function initGuildSettings() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id TEXT PRIMARY KEY,
      voice_log_channel_id TEXT,
      youtube_channel_id TEXT,
      live_alert_channel_id TEXT,
      welcome_channel_id TEXT,
      welcome_message TEXT,
      auto_role_id TEXT,
      stay_247 BOOLEAN DEFAULT false,
      self_role_categories JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Load all guild settings into cache
  const result = await pool.query('SELECT * FROM guild_settings');
  cache = {};
  for (const row of result.rows) {
    cache[row.guild_id] = {
      voiceLogChannelId: row.voice_log_channel_id,
      youtubeChannelId: row.youtube_channel_id,
      liveAlertChannelId: row.live_alert_channel_id,
      welcomeChannelId: row.welcome_channel_id,
      welcomeMessage: row.welcome_message,
      autoRoleId: row.auto_role_id,
      stay247: row.stay_247,
      selfRoleCategories: row.self_role_categories || {},
    };
  }

  console.log('🗄️  Guild settings table ready and cache loaded.');
}

// Synchronous: reads from cache
function getGuildSettings(guildId) {
  return cache[guildId] || {};
}

// Asynchronous: writes to DB first, then updates cache
async function updateGuildSettings(guildId, patch) {
  try {
    // Prepare the update query dynamically
    const mappings = {
      voiceLogChannelId: 'voice_log_channel_id',
      youtubeChannelId: 'youtube_channel_id',
      liveAlertChannelId: 'live_alert_channel_id',
      welcomeChannelId: 'welcome_channel_id',
      welcomeMessage: 'welcome_message',
      autoRoleId: 'auto_role_id',
      stay247: 'stay_247',
      selfRoleCategories: 'self_role_categories',
    };

    const keys = Object.keys(patch).filter(k => mappings[k]);
    if (keys.length === 0) return getGuildSettings(guildId);

    const cols = ['guild_id', ...keys.map(k => mappings[k])];
    const values = [
      guildId,
      ...keys.map(k => {
        if (k === 'selfRoleCategories') {
          return JSON.stringify(patch[k]);
        }
        return patch[k];
      }),
    ];
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const updateClause = keys
      .map(k => `${mappings[k]} = EXCLUDED.${mappings[k]}`)
      .join(', ');

    const query = `INSERT INTO guild_settings (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (guild_id) DO UPDATE SET ${updateClause}, updated_at = NOW()`;
    await pool.query(query, values);

    // Update cache after successful DB write
    if (!cache[guildId]) {
      cache[guildId] = {};
    }
    Object.assign(cache[guildId], patch);

    return cache[guildId];
  } catch (err) {
    console.error('Failed to update guild settings:', err.message);
    throw err;
  }
}

// Synchronous: reads from cache
function getAllGuildSettings() {
  return cache;
}

// Synchronous: reads from cache
function get247(guildId) {
  return getGuildSettings(guildId).stay247 || false;
}

// Asynchronous: writes to DB, then updates cache
async function set247(guildId, value) {
  return updateGuildSettings(guildId, { stay247: value });
}

// Asynchronous: writes to DB, then updates cache
async function addSelfRole(guildId, category, roleId) {
  const settings = getGuildSettings(guildId);
  const categories = { ...settings.selfRoleCategories } || {};
  if (!categories[category]) categories[category] = [];
  if (!categories[category].includes(roleId)) categories[category].push(roleId);
  return updateGuildSettings(guildId, { selfRoleCategories: categories });
}

// Asynchronous: writes to DB, then updates cache
async function removeSelfRole(guildId, roleId) {
  const settings = getGuildSettings(guildId);
  const categories = { ...settings.selfRoleCategories } || {};
  let foundCategory = null;

  for (const [category, roleIds] of Object.entries(categories)) {
    if (roleIds.includes(roleId)) {
      categories[category] = roleIds.filter(id => id !== roleId);
      if (categories[category].length === 0) delete categories[category];
      foundCategory = category;
      break;
    }
  }

  await updateGuildSettings(guildId, { selfRoleCategories: categories });
  return foundCategory;
}

module.exports = {
  initGuildSettings,
  getGuildSettings,
  updateGuildSettings,
  getAllGuildSettings,
  get247,
  set247,
  addSelfRole,
  removeSelfRole,
};
