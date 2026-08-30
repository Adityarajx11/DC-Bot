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

module.exports = { pool, initDatabase, createCase, getCases, addNote, getNotes };
