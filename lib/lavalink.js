const { EmbedBuilder } = require('discord.js');

let manager = null;

function attachLavalink(client) {
  let host = process.env.LAVALINK_HOST;
  let password = process.env.LAVALINK_PASSWORD;

  if (!host || !password) {
    console.warn('⚠️ Lavalink is not configured. Music features disabled until LAVALINK_HOST and LAVALINK_PASSWORD are set.');
    return null;
  }

  host = host.trim().replace(/^https?:\/\//, '').split(':')[0];
  password = password.trim();

  console.log('📋 Cleaned Lavalink config → host:', host);

  const { LavalinkManager } = require('lavalink-client');

  manager = new LavalinkManager({
    nodes: [
      {
        id: 'main',
        host,
        port: Number(process.env.LAVALINK_PORT || 2333),
        authorization: password,
        secure: process.env.LAVALINK_SECURE === 'true',
      },
    ],
    sendToShard: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        guild.shard?.send(payload);
      }
    },
    client: {
      id: client.user?.id,
      username: client.user?.username || 'Bot',
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  console.log('🔧 Lavalink Manager initialized.');
  console.log('📋 Node config (password masked):', {
    id: 'main',
    host,
    port: Number(process.env.LAVALINK_PORT || 2333),
    authorization: '***',
    secure: process.env.LAVALINK_SECURE === 'true',
  });

  manager.nodeManager.on('connect', node => {
    console.log(`✅ Node "${node.id}" connected.`);
  });

  manager.nodeManager.on('error', (node, err) => {
    console.error(`❌ Node "${node.id}" error:`, err?.message || err);
  });

  manager.nodeManager.on('disconnect', (node, reason) => {
    console.warn(`⚠️ Node "${node.id}" disconnected:`, reason);
  });

  manager.nodeManager.on('reconnecting', node => {
    console.log(`🔄 Node "${node.id}" reconnecting...`);
  });

  manager.nodeManager.on('create', node => {
    console.log(`🆕 Node "${node.id}" created.`);
  });

  manager.nodeManager.on('destroy', (node, reason) => {
    console.log(`🗑️ Node "${node.id}" destroyed:`, reason);
  });

  manager.on('trackStart', (player, track) => {
    const channel = client.channels.cache.get(player.textChannelId);
    if (!channel) return;

    const { buildControlRow, buildNowPlayingEmbed } = require('./musicButtons');
    channel.send({
      embeds: [buildNowPlayingEmbed(track, player)],
      components: buildControlRow(player),
    }).catch(() => {});
  });

  manager.on('queueEnd', (player) => {
    const channel = client.channels.cache.get(player.textChannelId);
    channel?.send('📭 Queue finished. Add more with `/play`.').catch(() => {});
  });

  manager.on('trackError', (player, track, payload) => {
    console.error('Track error:', payload?.exception?.message || payload);
    const channel = client.channels.cache.get(player.textChannelId);
    channel?.send(`⚠️ Error playing **${track?.info?.title || 'track'}**, skipping.`).catch(() => {});
  });

  client.lavalink = manager;
  return manager;
}

function getManager() {
  return manager;
}

async function searchTrack(query, requestUser) {
  if (!manager || manager.nodeManager.nodes.size === 0) {
    throw new Error('No Lavalink nodes are connected. Check LAVALINK_HOST, LAVALINK_PORT, and LAVALINK_PASSWORD.');
  }

  try {
    const node = manager.nodeManager.leastUsedNodes()[0];
    if (!node) throw new Error('No Lavalink node connected.');

    const isUrl = /^https?:\/\//i.test(query);
    const res = await node.search({ query, source: isUrl ? undefined : 'ytsearch' }, requestUser);

    if (!res || !res.tracks || res.tracks.length === 0) return null;

    const track = res.tracks[0];
    track.requester = requestUser;
    return track;
  } catch (err) {
    console.error('Lavalink search error:', err?.message || err);
    throw new Error('Failed to search for tracks. Ensure LavaLink is running and accessible.');
  }
}

function getOrCreatePlayer(interaction) {
  if (!manager) {
    throw new Error('Lavalink manager not initialized');
  }

  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    throw new Error('You must be in a voice channel to use music commands.');
  }

  let player = manager.getPlayer(interaction.guild.id);
  if (!player) {
    player = manager.createPlayer({
      guildId: interaction.guild.id,
      voiceChannelId: voiceChannel.id,
      textChannelId: interaction.channel.id,
      selfDeaf: true,
    });
  }

  return player;
}

module.exports = {
  attachLavalink,
  getManager,
  searchTrack,
  getOrCreatePlayer,
};
