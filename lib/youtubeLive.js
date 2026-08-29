const { EmbedBuilder } = require('discord.js');
const { getAllGuildSettings } = require('./guildSettings');

const lastAlertedVideoIds = new Map();

async function checkGuildLive(client, guildId, settings) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const { youtubeChannelId, liveAlertChannelId } = settings;

  if (!apiKey || !youtubeChannelId || !liveAlertChannelId) return;

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${youtubeChannelId}&eventType=live&type=video&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return;

    const live = data.items[0];
    const videoId = live.id.videoId;

    if (lastAlertedVideoIds.get(guildId) === videoId) return;
    lastAlertedVideoIds.set(guildId, videoId);

    const alertChannel = client.channels.cache.get(liveAlertChannelId);
    if (!alertChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setAuthor({ name: live.snippet.channelTitle })
      .setTitle(live.snippet.title)
      .setURL(`https://www.youtube.com/watch?v=${videoId}`)
      .setDescription(live.snippet.description?.slice(0, 200) || '')
      .setImage(live.snippet.thumbnails?.high?.url || live.snippet.thumbnails?.default?.url)
      .setFooter({ text: 'YouTube Live' })
      .setTimestamp();

    await alertChannel.send({
      content: `🔴 **${live.snippet.channelTitle}** is live now! https://www.youtube.com/watch?v=${videoId}`,
      embeds: [embed],
    });
  } catch (err) {
    console.error(`YouTube live-check error (guild ${guildId}):`, err.message);
  }
}

async function checkAllGuilds(client) {
  const allSettings = getAllGuildSettings();
  const entries = Object.entries(allSettings).filter(([, s]) => s.youtubeChannelId && s.liveAlertChannelId);

  for (const [guildId, settings] of entries) {
    await checkGuildLive(client, guildId, settings);
  }
}

function startLivePolling(client) {
  const intervalMinutes = Number(process.env.YOUTUBE_POLL_MINUTES || 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`📡 YouTube live-check polling every ${intervalMinutes} minute(s) across all configured servers.`);

  setTimeout(() => checkAllGuilds(client), 15_000);
  setInterval(() => checkAllGuilds(client), intervalMs);
}

module.exports = { startLivePolling };
