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
    console.error('Playback error:', err.message);
    queue.textChannel.send(`⚠️ Couldn't play **${song.title}**, skipping.`).catch(() => {});
    handleSongEnd(guildId);
  }
}

async function resolveSong(query, requestedBy) {
  const isUrl = play.yt_validate(query) === 'video';

  if (isUrl) {
    const info = await play.video_basic_info(query);
    return {
      title: info.video_details.title,
      url: info.video_details.url,
      requestedBy,
    };
  }

  const results = await play.search(query, { limit: 1, source: { youtube: 'video' } });
  if (!results || results.length === 0) return null;

  return {
    title: results[0].title,
    url: results[0].url,
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
