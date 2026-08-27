// Run this once (and again whenever you add/change a command) to register
// slash commands with Discord: `npm run deploy`
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s)...`);

    // Guild-scoped deploy = shows up instantly, good for dev/testing.
    // Switch to Routes.applicationCommands(CLIENT_ID) for global (takes up to 1hr to propagate).
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('✅ Commands deployed.');
  } catch (err) {
    console.error(err);
  }
})();
