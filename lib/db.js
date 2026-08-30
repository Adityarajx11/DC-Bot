const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mod_notes (
      id SERIAL PRIMARY KEY,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      note TEXT NOT NULL,
      added_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS mod_cases (
      id SERIAL PRIMARY KEY,
      guild_id TEXT NOT NULL,
      case_number INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_tag TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      moderator_tag TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_xp (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      last_message_at TIMESTAMPTZ,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS level_roles (
      guild_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, level)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS guild_case_counters (
      guild_id TEXT PRIMARY KEY,
      last_case_number INTEGER DEFAULT 0
    );
  `);

  console.log('🗄️  Database tables ready.');
}

async function nextCaseNumber(guildId) {
  const result = await pool.query(
    `INSERT INTO guild_case_counters (guild_id, last_case_number)
     VALUES ($1, 1)
     ON CONFLICT (guild_id) DO UPDATE SET last_case_number = guild_case_counters.last_case_number + 1
     RETURNING last_case_number`,
    [guildId]
  );
  return result.rows[0].last_case_number;
}

async function createCase({ guildId, action, targetId, targetTag, moderatorId, moderatorTag, reason }) {
  const caseNumber = await nextCaseNumber(guildId);
  await pool.query(
    `INSERT INTO mod_cases (guild_id, case_number, action, target_id, target_tag, moderator_id, moderator_tag, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [guildId, caseNumber, action, targetId, targetTag, moderatorId, moderatorTag, reason || 'No reason provided']
  );
  return caseNumber;
}

async function getCases(guildId, targetId, limit = 10) {
  const result = await pool.query(
    `SELECT * FROM mod_cases WHERE guild_id = $1 AND target_id = $2 ORDER BY created_at DESC LIMIT $3`,
    [guildId, targetId, limit]
  );
  return result.rows;
}

async function addNote(guildId, userId, note, addedBy) {
  await pool.query(
    `INSERT INTO mod_notes (guild_id, user_id, note, added_by) VALUES ($1, $2, $3, $4)`,
    [guildId, userId, note, addedBy]
  );
}

async function getNotes(guildId, userId) {
  const result = await pool.query(
    `SELECT * FROM mod_notes WHERE guild_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
    [guildId, userId]
  );
  return result.rows;
}

async function getUserXp(guildId, userId) {
  const result = await pool.query(
    `SELECT * FROM user_xp WHERE guild_id = $1 AND user_id = $2`,
    [guildId, userId]
  );
  return result.rows[0] || null;
}

async function upsertUserXp(guildId, userId, xp, level, lastMessageAt) {
  await pool.query(
    `INSERT INTO user_xp (guild_id, user_id, xp, level, last_message_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (guild_id, user_id)
     DO UPDATE SET xp = $3, level = $4, last_message_at = $5`,
    [guildId, userId, xp, level, lastMessageAt]
  );
}

async function getLeaderboard(guildId, limit = 10) {
  const result = await pool.query(
    `SELECT * FROM user_xp WHERE guild_id = $1 ORDER BY level DESC, xp DESC LIMIT $2`,
    [guildId, limit]
  );
  return result.rows;
}

async function addLevelRole(guildId, level, roleId) {
  await pool.query(
    `INSERT INTO level_roles (guild_id, level, role_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (guild_id, level) DO UPDATE SET role_id = $3`,
    [guildId, level, roleId]
  );
}

async function removeLevelRole(guildId, level) {
  await pool.query(`DELETE FROM level_roles WHERE guild_id = $1 AND level = $2`, [guildId, level]);
}

async function getLevelRoles(guildId) {
  const result = await pool.query(
    `SELECT * FROM level_roles WHERE guild_id = $1 ORDER BY level ASC`,
    [guildId]
  );
  return result.rows;
}

module.exports = {
  pool,
  initDatabase,
  createCase,
  getCases,
  addNote,
  getNotes,
  getUserXp,
  upsertUserXp,
  getLeaderboard,
  addLevelRole,
  removeLevelRole,
  getLevelRoles,
};
