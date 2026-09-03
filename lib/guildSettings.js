const { pool } = require('./db');

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

  console.log('🗄️  Guild settings table ready.');
}

// Asynchronous: reads directly from DB
async function getGuildSettings(guildId) {
  try {
    const result = await pool.query(
      'SELECT * FROM guild_settings WHERE guild_id = $1',
      [guildId]
    );
    if (result.rows.length === 0) return {};
    const row = result.rows[0];
    return {
      voiceLogChannelId: row.voice_log_channel_id,
      youtubeChannelId: row.youtube_channel_id,
      liveAlertChannelId: row.live_alert_channel_id,
      welcomeChannelId: row.welcome_channel_id,
      welcomeMessage: row.welcome_message,
      autoRoleId: row.auto_role_id,
      stay247: row.stay_247,
      selfRoleCategories: row.self_role_categories || {},
    };
  } catch (err) {
    console.error('Failed to fetch guild settings:', err.message);
    return {};
  }
}

// Asynchronous: writes to DB
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

    return getGuildSettings(guildId);
  } catch (err) {
    console.error('Failed to update guild settings:', err.message);
    throw err;
  }
}

// Asynchronous: reads directly from DB
async function getAllGuildSettings() {
  try {
    const result = await pool.query('SELECT * FROM guild_settings');
    const settings = {};
    for (const row of result.rows) {
      settings[row.guild_id] = {
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
    return settings;
  } catch (err) {
    console.error('Failed to fetch all guild settings:', err.message);
    return {};
  }
}

// Asynchronous: reads directly from DB
async function get247(guildId) {
  const settings = await getGuildSettings(guildId);
  return settings.stay247 || false;
}

// Asynchronous: writes to DB
async function set247(guildId, value) {
  return updateGuildSettings(guildId, { stay247: value });
}

// Asynchronous: writes to DB
async function addSelfRole(guildId, category, roleId) {
  const settings = await getGuildSettings(guildId);
  const categories = { ...settings.selfRoleCategories } || {};
  if (!categories[category]) categories[category] = [];
  if (!categories[category].includes(roleId)) categories[category].push(roleId);
  return updateGuildSettings(guildId, { selfRoleCategories: categories });
}

// Asynchronous: writes to DB
async function removeSelfRole(guildId, roleId) {
  const settings = await getGuildSettings(guildId);
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
