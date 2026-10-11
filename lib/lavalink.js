const { EmbedBuilder } = require('discord.js');

let manager = null;

function attachLavalink(client) {
  const { LavalinkManager } = require('lavalink-client');

  manager = new LavalinkManager({
    nodes: [
      {
        authorization: process.env.LAVALINK_PASSWORD,
        host: process.env.LAVALINK_HOST,
        port: parseInt(process.env.LAVALINK_PORT, 10),
        secure: process.env.LAVALINK_SECURE === 'true',
      },
    ],
    sendWsMessage: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        guild.shard?.send(payload);
      }
    },
  });

  manager.on('nodeConnect', node => {
    console.log(`🎧 Lavalink node "${node.options.host}" connected.`);
  });

  manager.on('nodeError', (node, err) => {
    console.error(`Lavalink node error (${node.options.host}):`, err?.message || err);
  });

  manager.on('trackError', (player, track, error) => {
    const channel = client.channels.cache.get(player.textChannelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Track Error')
        .setDescription(`Failed to play: **${track.info.title}**`)
        .setFooter({ text: 'RAVEN • Music' });

      channel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  client.lavalink = manager;
}

async function searchTrack(query) {
  if (!manager || manager.nodes.size === 0) {
    throw new Error('No Lavalink nodes are connected. Check your LAVALINK_HOST, LAVALINK_PORT, and LAVALINK_PASSWORD.');
  }

  try {
    const results = await manager.search(query, { requester: 'bot' });
    return results;
  } catch (err) {
    console.error('Lavalink search error:', err?.message || err);
    throw new Error('Failed to search for tracks. Ensure Lavalink is running and accessible.');
  }
}

function getOrCreatePlayer(guildId, voiceChannelId, textChannelId) {
  if (!manager) {
    throw new Error('Lavalink manager not initialized');
  }

  let player = manager.players.get(guildId);
  if (!player) {
    player = manager.create({
      guildId,
      voiceChannelId,
      textChannelId,
      selfMute: false,
      selfDeafen: false,
    });
  }
  return player;
}

module.exports = {
  attachLavalink,
  searchTrack,
  getOrCreatePlayer,
};
