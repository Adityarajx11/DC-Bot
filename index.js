// deploy check
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { attachLavalink } = require('./lib/lavalink');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

attachLavalink(client);

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`Error running /${interaction.commandName}:`, err);
      const errMsg = { content: '⚠️ Something went wrong running that command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg);
      } else {
        await interaction.reply(errMsg);
      }
    }
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith('music_')) {
    const { handleMusicButton } = require('./lib/musicButtons');
    try {
      await handleMusicButton(interaction);
    } catch (err) {
      console.error('Music button error:', err);
      const errMsg = { content: '⚠️ Something went wrong with that button.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg).catch(() => {});
      } else {
        await interaction.reply(errMsg).catch(() => {});
      }
    }
  }

  if (interaction.isButton() && interaction.customId.startsWith('poll_')) {
    const { handlePollButton } = require('./lib/pollButtons');
    try {
      await handlePollButton(interaction);
    } catch (err) {
      console.error('Poll button error:', err);
      const errMsg = { content: '⚠️ Something went wrong with that vote.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg).catch(() => {});
      } else {
        await interaction.reply(errMsg).catch(() => {});
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('selfrole_')) {
    const { handleSelfRoleSelect } = require('./lib/selfRoleMenu');
    try {
      await handleSelfRoleSelect(interaction);
    } catch (err) {
      console.error('Self-role menu error:', err);
      const errMsg = { content: '⚠️ Something went wrong updating your roles.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg).catch(() => {});
      } else {
        await interaction.reply(errMsg).catch(() => {});
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
