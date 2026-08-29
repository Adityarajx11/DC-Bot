const { EmbedBuilder } = require('discord.js');

let lastAlertedVideoId = null;

async function checkIfLive(client) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const alertChannelId = process.env.LIVE_ALERT_CHANNEL_ID;

  if (!apiKey || !channelId || !alertChannelId) return;

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      return;
    }

    const live = data.items[0];
    const videoId = live.id.videoId;

    if (videoId === lastAlertedVideoId) return;
    lastAlertedVideoId = videoId;

    const alertChannel = client.channels.cache.get(alertChannelId);
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
    console.error('YouTube live-check error:', err.message);
  }
}

function startLivePolling(client) {
  const intervalMinutes = Number(process.env.YOUTUBE_POLL_MINUTES || 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`📡 YouTube live-check polling every ${intervalMinutes} minute(s).`);

  setTimeout(() => checkIfLive(client), 15_000);
  setInterval(() => checkIfLive(client), intervalMs);
}

module.exports = { startLivePolling };
