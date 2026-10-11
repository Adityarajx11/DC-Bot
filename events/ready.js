const { startLivePolling } = require('../lib/youtubeLive');
const { initDatabase } = require('../lib/db');
const { initTickets } = require('../lib/ticketStore');
const { initGuildSettings } = require('../lib/guildSettings');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await initDatabase();
    await initTickets();
    await initGuildSettings();
    startLivePolling(client);

    if (!client.lavalink) {
      console.log('❌ Lavalink disabled: LAVALINK_HOST or LAVALINK_PASSWORD not set');
      return;
    }

    try {
      await client.lavalink.init({
        id: client.user.id,
        username: client.user.username,
      });
      console.log('🎵 Lavalink manager initialised');
      console.log(client.lavalink.nodeManager.nodes.size);
    } catch (e) {
      console.error('Lavalink init failed:', e);
    }
  },
};
