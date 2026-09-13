const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const gtts = require('google-tts-api');
const prism = require('prism-media');
const ffmpegStatic = require('ffmpeg-static');
const https = require('https');
const { Readable } = require('stream');
const { getGuildSettings } = require('../lib/guildSettings');

const THEME_COLOR = 0x8B0000;
const greetingInProgress = new Map(); // Prevent overlapping greetings per guild

function buildEmbed({ name, avatar, action, emoji, channelName, memberCount, footerIcon }) {
  return new EmbedBuilder()
    .setColor(THEME_COLOR)
    .setAuthor({ name: `${emoji} Voice Activity`, iconURL: footerIcon })
    .setThumbnail(avatar)
    .setTitle(`${name}`)
    .setDescription(`**${name}** ${action}`)
    .addFields(
      { name: 'Channel', value: channelName, inline: true },
      { name: 'Members in VC', value: `${memberCount}`, inline: true },
    )
    .setFooter({ text: 'Voice Log', iconURL: footerIcon })
    .setTimestamp();
}

// Helper: split text into sentence-sized chunks (respecting ~200 char limit)
function splitTextIntoChunks(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > 200) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Helper: download audio from URL
function downloadAudio(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download audio: HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Helper: play audio chunks sequentially
async function playAudioSequence(connection, audioChunks) {
  const player = createAudioPlayer();
  connection.subscribe(player);
  
  for (const audioBuffer of audioChunks) {
    try {
      // Convert buffer to readable stream for piping into ffmpeg
      const audioStream = Readable.from(audioBuffer);
      
      const ffmpeg = new prism.FFmpeg({
        args: [
          '-i', 'pipe:0',
          '-f', 's16le',
          '-ar', '48000',
          '-ac', '2',
          'pipe:1',
        ],
        executable: ffmpegStatic,
      });
      
      const resource = createAudioResource(audioStream.pipe(ffmpeg), { inputType: StreamType.Raw });
      
      await new Promise((resolve, reject) => {
        player.play(resource);
        player.once(AudioPlayerStatus.Idle, resolve);
        player.once('error', reject);
        setTimeout(() => reject(new Error('Audio playback timed out after 30 seconds')), 30000); // 30s timeout per chunk
      });
    } catch (err) {
      throw new Error(`Failed to play audio chunk: ${err.message}`);
    }
  }
}

// Helper: generate and download TTS audio chunks
async function generateTTSAudio(text) {
  const chunks = splitTextIntoChunks(text);
  const audioChunks = [];
  
  for (const chunk of chunks) {
    try {
      const url = await gtts.getAudioUrl(chunk, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });
      const audioBuffer = await downloadAudio(url);
      audioChunks.push(audioBuffer);
    } catch (err) {
      throw new Error(`Failed to generate TTS for chunk: ${err.message}`);
    }
  }
  
  return audioChunks;
}

// Main greeting handler
async function handleVoiceGreeting(newState, settings) {
  const { greetingVoiceChannelId, greetingMemberRoleId } = settings;
  const guildId = newState.guild.id;
  const member = newState.member;
  
  // Skip if already greeting in this guild
  if (greetingInProgress.has(guildId)) return;
  
  // Skip bots
  if (member.user.bot) return;
  
  // Only proceed if configured and channel matches
  if (!greetingVoiceChannelId || newState.channelId !== greetingVoiceChannelId) return;
  
  greetingInProgress.set(guildId, true);
  
  try {
    // Join voice channel
    const connection = joinVoiceChannel({
      channelId: newState.channelId,
      guildId: guildId,
      adapterCreator: newState.guild.voiceAdapterCreator,
    });
    
    // Wait for the connection to become ready before playing audio
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    
    const welcomeText = "Welcome to Raven Modz! Please make sure to read the rules, respect everyone, and enjoy your time here. If you ever need help, feel free to talk to us in a ticket, and our support team will be happy to help. Once again, welcome to Raven Modz, we are glad to have you!";
    
    // Generate and play TTS audio
    try {
      const audioChunks = await generateTTSAudio(welcomeText);
      await playAudioSequence(connection, audioChunks);
    } catch (audioErr) {
      console.error('⚠️ TTS playback failed, continuing with role assignment:', audioErr.message);
    }
    
    // Assign role if configured
    if (greetingMemberRoleId) {
      try {
        const role = newState.guild.roles.cache.get(greetingMemberRoleId);
        if (role) {
          await member.roles.add(role);
          console.log(`✅ Assigned greeting role to ${member.user.tag}`);
        }
      } catch (roleErr) {
        console.error(`⚠️ Failed to assign greeting role: ${roleErr.message}`);
      }
    }
    
    // Disconnect
    connection.destroy();
    console.log(`✅ Voice greeting completed for ${member.user.tag}`);
  } catch (err) {
    console.error('⚠️ Voice greeting failed:', err.message);
  } finally {
    greetingInProgress.delete(guildId);
  }
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const settings = await getGuildSettings(newState.guild.id);
    const logChannelId = settings.voiceLogChannelId;
    if (!logChannelId) return;

    const channel = newState.guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const member = newState.member ?? oldState.member;
    const name = member.displayName;
    const avatar = member.displayAvatarURL({ size: 256 });
    const guildIcon = newState.guild.iconURL({ size: 256 });

    let embed = null;

    if (!oldState.channelId && newState.channelId) {
      // Handle voice greeting in parallel with logging
      handleVoiceGreeting(newState, settings).catch(err => {
        console.error('Voice greeting error:', err.message);
      });
      
      embed = buildEmbed({
        name, avatar,
        action: `joined **${newState.channel.name}**`,
        emoji: '🔊',
        channelName: newState.channel.name,
        memberCount: newState.channel.members.size,
        footerIcon: guildIcon,
      });
    }
    else if (oldState.channelId && !newState.channelId) {
      embed = buildEmbed({
        name, avatar,
        action: `left **${oldState.channel.name}**`,
        emoji: '🔇',
        channelName: oldState.channel.name,
        memberCount: oldState.channel.members.size,
        footerIcon: guildIcon,
      });
    }
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      embed = buildEmbed({
        name, avatar,
        action: `moved from **${oldState.channel.name}** to **${newState.channel.name}**`,
        emoji: '↔️',
        channelName: newState.channel.name,
        memberCount: newState.channel.members.size,
        footerIcon: guildIcon,
      });
    }

    if (!embed) return;

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('⚠️ Could not send voice alert:', err.message);
    }
  },
};
