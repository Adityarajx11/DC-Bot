const { EmbedBuilder } = require('discord.js');
const gtts = require('google-tts-api');
const https = require('https');
const { getGuildSettings } = require('../lib/guildSettings');
const { getManager, searchTrack } = require('../lib/lavalink');

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

// Helper: play audio chunks sequentially through Lavalink
async function playAudioSequenceLavalink(player, audioUrls, guildId, member) {
  const manager = getManager();
  const totalChunks = audioUrls.length;
  
  for (let i = 0; i < audioUrls.length; i++) {
    const audioUrl = audioUrls[i];
    const isLastChunk = (i === totalChunks - 1);
    
    try {
      // Load the TTS audio URL as a track using searchTrack (same as music commands)
      console.log(`🔍 Searching for track: ${audioUrl.substring(0, 80)}...`);
      const track = await searchTrack(audioUrl, null);
      if (!track) {
        throw new Error(`Failed to load audio URL: ${audioUrl}`);
      }
      console.log(`✅ Track loaded for chunk ${i + 1}:`, {
        title: track.info?.title || 'unknown',
        duration: track.info?.length || 'unknown',
        isStream: track.info?.isStream || false,
        uri: track.info?.uri?.substring(0, 60) || 'unknown'
      });
      
      console.log(`📢 TTS chunk ${i + 1}/${audioUrls.length} loaded, queuing for playback`);
      
      // Play the track and wait for it to finish
      await new Promise((resolve, reject) => {
        player.queue.add(track);
        
        // Only call play() for the first chunk; lavalink-client auto-advances
        if (i === 0) {
          console.log(`▶️ Starting playback of first TTS chunk`);
          const volumeValue = 150;
          console.log(`🔊 Setting volume to ${volumeValue}`);
          // Set volume to 150 (well above baseline of 100) for better mobile client reception
          player.setVolume(volumeValue);
          console.log(`🔊 Volume confirmed set to ${volumeValue}`);
          console.log(`🎬 Calling player.play() for first track:`, track.info?.title || 'unknown');
          player.play();
        } else {
          console.log(`⏳ Chunk ${i + 1} queued, waiting for auto-advance`);
        }
        
        // Wait for track to finish
        const trackEndHandler = async () => {
          console.log(`✅ TTS chunk ${i + 1} finished playing`);
          
          // If this is the last chunk, disconnect immediately when it ends
          if (isLastChunk) {
            console.log(`🔌 Last TTS chunk finished. Initiating immediate disconnect for guild ${guildId}`);
            manager.removeListener('trackEnd', trackEndHandler);
            manager.removeListener('trackError', trackErrorHandler);
            
            // Disconnect bot first
            if (player && player.connected) {
              try {
                await player.destroy();
                console.log(`🤖 Bot player destroyed for guild ${guildId}`);
              } catch (err) {
                console.error(`⚠️ Error destroying player on trackEnd: ${err.message}`);
              }
            }
            
            // Disconnect the member after bot disconnects
            if (member && member.voice && member.voice.channel) {
              try {
                await member.voice.disconnect('Greeting completed');
                console.log(`👤 Member ${member.user.tag} disconnected after greeting`);
              } catch (memberErr) {
                console.error(`⚠️ Failed to disconnect member ${member.user.tag}: ${memberErr.message}`);
              }
            }
          }
          
          manager.removeListener('trackEnd', trackEndHandler);
          manager.removeListener('trackError', trackErrorHandler);
          resolve();
        };
        
        const trackErrorHandler = (p, track, payload) => {
          console.log(`🔴 trackError fired for guild ${guildId}, chunk ${i + 1}:`, {
            message: payload?.exception?.message || 'unknown error',
            severity: payload?.exception?.severity || 'unknown',
            cause: payload?.exception?.cause || 'unknown'
          });
          if (p.guildId === guildId) {
            console.error(`❌ TTS chunk ${i + 1} error: ${payload?.exception?.message || 'unknown'}`);
            manager.removeListener('trackEnd', trackEndHandler);
            manager.removeListener('trackError', trackErrorHandler);
            reject(new Error(`Track error: ${payload?.exception?.message || 'unknown'}`));
          }
        };
        
        // Also listen for queueEnd to catch the final completion
        const queueEndHandler = (p) => {
          if (p.guildId === guildId && isLastChunk) {
            console.log(`🎵 Queue ended for guild ${guildId}. Last chunk was index ${i}.`);
            manager.removeListener('queueEnd', queueEndHandler);
          }
        };
        
        const trackStartHandler = (p, track) => {
          if (p.guildId === guildId) {
            console.log(`▶️ trackStart fired: now playing chunk ${i + 1} (${track.info?.title || 'unknown'})`);
          }
        };
        
        manager.once('trackEnd', trackEndHandler);
        manager.once('trackError', trackErrorHandler);
        manager.once('queueEnd', queueEndHandler);
        manager.once('trackStart', trackStartHandler);
        
        // Timeout after 30 seconds per chunk
        setTimeout(() => {
          console.error(`⏱️ TTS chunk ${i + 1} timed out after 30 seconds`);
          manager.removeListener('trackEnd', trackEndHandler);
          manager.removeListener('trackError', trackErrorHandler);
          manager.removeListener('queueEnd', queueEndHandler);
          manager.removeListener('trackStart', trackStartHandler);
          reject(new Error('Audio playback timed out after 30 seconds'));
        }, 30000);
      });
    } catch (err) {
      throw new Error(`Failed to play audio chunk: ${err.message}`);
    }
  }
}

// Helper: generate TTS audio URLs (don't download, just get URLs)
async function generateTTSAudioUrls(text) {
  const chunks = splitTextIntoChunks(text);
  const audioUrls = [];
  
  for (const chunk of chunks) {
    try {
      const url = await gtts.getAudioUrl(chunk, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });
      audioUrls.push(url);
    } catch (err) {
      throw new Error(`Failed to generate TTS for chunk: ${err.message}`);
    }
  }
  
  return audioUrls;
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
  let player = null;
  
  try {
    const manager = getManager();
    if (!manager) throw new Error('Lavalink manager not initialized');
    
    // Get or create a Lavalink player for this voice channel
    player = manager.getPlayer(guildId);
    if (!player) {
      player = manager.createPlayer({
        guildId: guildId,
        voiceChannelId: newState.channelId,
        textChannelId: null, // No text channel needed for greeting
        selfDeaf: true,
      });
    }
    
    // Connect player to voice channel (required before playing audio)
    if (!player.connected) {
      await player.connect();
      console.log(`✅ Player connected to voice channel for guild ${guildId}`);
    } else {
      console.log(`ℹ️ Player already connected to voice channel for guild ${guildId}`);
    }
    
    const welcomeText = `Welcome to Raven Modz! Please make sure to read the rules, respect everyone, and enjoy your time here. If you ever need help, feel free to talk to us in a ticket, and our team will assist you as soon as possible.`;
    
    // Generate and play TTS audio
    try {
      const audioUrls = await generateTTSAudioUrls(welcomeText);
      await playAudioSequenceLavalink(player, audioUrls, guildId, member);
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
    
    // Destroy the player to disconnect from voice (only if not already destroyed by trackEnd handler)
    if (player && player.connected) {
      await player.destroy();
      console.log(`✅ Voice greeting completed and player destroyed for ${member.user.tag}`);
    }
  } catch (err) {
    console.error('⚠️ Voice greeting failed:', err.message);
    // Clean up player on error
    if (player) {
      try {
        await player.destroy();
      } catch (destroyErr) {
        console.error('⚠️ Failed to destroy player on error:', destroyErr.message);
      }
    }
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
