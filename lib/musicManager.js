const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');

const queues = new Map();

function getQueue(guildId) {
  return queues.get(guildId);
}

function createQueue(guildId, voiceChannel, textChannel) {
  const player = createAudioPlayer();

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  connection.subscribe(player);

  const queue = {
    connection,
    player,
    textChannel,
    songs: [],
    loopMode: 'off',
    volume: 1,
    currentResource: null,
  };

  queues.set(guildId, queue);

  player.on(AudioPlayerStatus.Idle, () => handleSongEnd(guildId));
  player.on('error', (err) => {
    console.error('Player error:', err.message);
    handleSongEnd(guildId);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      destroyQueue(guildId);
    }
  });

  return queue;
}

function destroyQueue(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;
  try { queue.connection.destroy(); } catch {}
  queues.delete(guildId);
}

async function handleSongEnd(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  if (queue.loopMode === 'track' && queue.songs.length > 0) {
    await playSong(guildId, queue.songs[0]);
    return;
  }

  const finished = queue.songs.shift();

  if (queue.loopMode === 'queue' && finished) {
    queue.songs.push(finished);
  }

  if (queue.songs.length === 0) {
    queue.textChannel.send('📭 Queue finished. Add more with `/play`, or I\'ll leave if idle.').catch(() => {});
    return;
  }

  await playSong(guildId, queue.songs[0]);
}

async function playSong(guildId, song) {
  const queue = queues.get(guildId);
  if (!queue) return;

  if (!song || !song.url || typeof song.url !== 'string' || !song.url.startsWith('http')) {
    console.error('❌ playSong called with invalid song/url:', JSON.stringify(song));
    queue.textChannel.send(`⚠️ Couldn't play **${song?.title || 'that song'}** (bad URL), skipping.`).catch(() => {});
    return handleSongEnd(guildId);
  }

  console.log('▶️ Attempting to stream:', song.url);

  try {
    const stream = await play.stream(song.url);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
    resource.volume.setVolume(queue.volume);
    queue.currentResource = resource;
    queue.player.play(resource);

    queue.textChannel.send(`▶️ Now playing: **${song.title}**`).catch(() => {});
  } catch (err) {
    console.error(`Playback error for URL "${song.url}":`, err.message);
    queue.textChannel.send(`⚠️ Couldn't play **${song.title}**, skipping.`).catch(() => {});
    handleSongEnd(guildId);
  }
}

function buildWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

async function resolveSong(query, requestedBy) {
  const isUrl = play.yt_validate(query) === 'video';

  if (isUrl) {
    const info = await play.video_basic_info(query);
    const details = info.video_details;
    return {
      title: details.title,
      url: details.url || buildWatchUrl(details.id),
      requestedBy,
    };
  }

  const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
  if (!results || results.length === 0) return null;

  const video = results[0];
  const url = video.url || (video.id ? buildWatchUrl(video.id) : null);

  if (!url) {
    console.error('❌ Search result had no usable url/id:', JSON.stringify(video));
    return null;
  }

  return {
    title: video.title,
    url,
    requestedBy,
  };
}

module.exports = {
  getQueue,
  createQueue,
  destroyQueue,
  playSong,
  resolveSong,
};
