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

      setTimeout(async () => {
        let host = process.env.LAVALINK_HOST;
        const port = process.env.LAVALINK_PORT || 2333;
        const secure = process.env.LAVALINK_SECURE === 'true';
        const node = client.lavalink.nodeManager.nodes.get('main');

        host = host.trim().replace(/^https?:\/\//, '').split(':')[0];

        console.log('📊 Node state → connected:', node?.connected);
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 8000);
          const r = await fetch(`${secure ? 'https' : 'http'}://${host}:${port}/version`, {
            headers: { Authorization: process.env.LAVALINK_PASSWORD },
            signal: ctrl.signal,
          });
          clearTimeout(t);
          console.log('📡 Node REST check:', r.status, await r.text());
        } catch (e) {
          console.error('📡 Node REST check failed:', e.name, e.message, e.cause?.code);
        }
      }, 10000);
    } catch (e) {
      console.error('Lavalink init failed:', e);
    }
  },
};
