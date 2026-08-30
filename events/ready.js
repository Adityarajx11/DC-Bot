const { startLivePolling } = require('../lib/youtubeLive');
const { initManager } = require('../lib/lavalink');
const { initDatabase } = require('../lib/db');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await initDatabase();
    startLivePolling(client);
    initManager(client);
  },
};
