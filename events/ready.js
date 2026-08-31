const { startLivePolling } = require('../lib/youtubeLive');
const { initManager } = require('../lib/lavalink');
const { initDatabase } = require('../lib/db');
const { initTickets } = require('../lib/ticketStore');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await initDatabase();
    await initTickets();
    startLivePolling(client);
    initManager(client);
  },
};
