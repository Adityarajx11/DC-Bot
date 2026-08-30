require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// If there is no commands directory, skip deployment (safe for build environments)
if (!fs.existsSync(commandsPath)) {
  console.log('No commands directory found — skipping command deployment.');
  process.exit(0);
}

const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
if (commandFiles.length === 0) {
  console.log('No command files found in ./commands — skipping command deployment.');
  process.exit(0);
}

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    if (command && command.data && typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`Skipping ${file}: missing or invalid command.data`);
    }
  } catch (err) {
    console.warn(`Failed to load ${file}:`, err?.message || err);
  }
}

// If there are no valid commands after loading, exit cleanly
if (commands.length === 0) {
  console.log('No valid command definitions found — nothing to deploy.');
  process.exit(0);
}

// Guard required env vars. In build environments we prefer to skip rather than fail the whole build.
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
if (!token || !clientId) {
  console.log('BOT_TOKEN or CLIENT_ID not set in environment — skipping command deployment.');
  process.exit(0);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s) globally...`);

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('✅ Global commands deployed.');

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
        { body: [] },
      );
      console.log('🧹 Cleared old guild-specific commands (avoids duplicates).');
    }
  } catch (err) {
    console.error('Failed to deploy commands:', err);
    // Don't crash the process in CI — log and exit non-zero so a manual run can surface errors if desired
    process.exit(1);
  }
})();
