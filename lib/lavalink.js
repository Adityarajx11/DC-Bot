const { LavalinkManager } = require('lavalink-client');

let manager;

function attachLavalink(client) {
  manager = new LavalinkManager({
    nodes: [
      {
        id: 'main',
        host: process.env.LAVALINK_HOST,
        port: Number(process.env.LAVALINK_PORT || 443),
        authorization: process.env.LAVALINK_PASSWORD,
        secure: process.env.LAVALINK_SECURE === 'true',
      },
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    client: {
      id: client.user?.id,
      username: client.user?.username || 'Bot',
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  client.on('raw', (d) => manager.sendRawData(d));

  manager.nodeManager.on('connect', (node) => {
    console.log(`🎧 Lavalink node "${node.id}" connected.`);
  });
  manager.nodeManager.on('error', (node, error) => {
    console.error(`⚠️ Lavalink node "${node.id}" error:`, error?.message || error);
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

  return manager;
}

function initManager(client) {
  manager.init({ id: client.user.id, username: client.user.username });
}

function getManager() {
  return manager;
}

async function searchTrack(query, requestUser) {
  const node = manager.nodeManager.leastUsedNodes()[0];
  if (!node) throw new Error('No Lavalink node connected. Check LAVALINK_* env vars.');

  const isUrl = /^https?:\/\//i
