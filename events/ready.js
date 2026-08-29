const { startLivePolling } = require('../lib/youtubeLive');
const { initManager } = require('../lib/lavalink');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    startLivePolling(client);
    initManager(client);
  },
};
