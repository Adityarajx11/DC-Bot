# RAVEN

**A feature-rich, production-ready Discord bot for music, moderation, leveling, and server management.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14.16.3-5865F2?style=flat-square&logo=discord)](https://discord.js.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#license)
[![Maintained](https://img.shields.io/badge/Maintained-Yes-brightgreen?style=flat-square)](#)

## Overview

RAVEN is a comprehensive Discord bot built with **discord.js v14**, **Lavalink**, and **PostgreSQL**. It provides a complete suite of features including music playback, advanced moderation with case logging, member leveling and XP, ticket management, auto-roles, welcome cards, and real-time voice activity alerts. RAVEN is production-ready and designed to be modular—extend it easily by adding new commands and event listeners.

## Features

### Music
- **`/play`** — Search and play songs by name or YouTube URL
- **`/pause`**, **`/resume`**, **`/skip`** — Playback controls
- **`/stop`** — Stop music and leave voice channel
- **`/queue`** — Display current playlist
- **`/shuffle`** — Randomize queue order
- **`/loop`** — Cycle through loop modes (off / track / queue)
- **`/volume`** — Adjust playback volume
- **`/nowplaying`** — Show current track with control buttons
- **`/247`** — Keep bot connected to voice indefinitely

### Moderation
- **`/ban`** — Ban a user with logged case number
- **`/bulkban`** — Mass-ban multiple users
- **`/kick`** — Kick a user from the server
- **`/warn`** — Issue formal warning (persistent record)
- **`/note`** — Add private mod notes on users
- **`/cases`** — View full moderation history for a user
- **`/mylist`** — Create and manage watch/ban lists

### Leveling & XP
- **`/rank`** — Display user's current XP, level, and server rank
- **`/leaderboard`** — Show top XP earners in the server
- **`/levelconfig`** — Admin command to configure level-up announcements and role rewards

### Tickets
- **`/ticketsetup`** — Configure ticket system (category, staff role, max tickets per user, categories, banner)
- **`/ticketpanel`** — Create a panel message for users to open tickets
- Ticket lifecycle: create → claim by staff → set priority → close with transcript

### Server Setup & Administration
- **`/setup voicelog`** — Configure voice join/leave alert channel
- **`/setup youtube`** — Set up YouTube live notifications
- **`/setup welcome`** — Configure welcome messages with custom templates
- **`/setup autorole`** — Auto-assign role to new members
- **`/setup selfroleadd`** — Create self-assignable role categories
- **`/setup selfroleremove`** — Remove self-assignable roles
- **`/setup show`** — View current server configuration
- **`/roles`** — List all self-assignable roles
- **`/join`** / **`/leave`** — Manual voice channel join/leave (testing)
- **`/remind`** — Schedule time-based reminders for users

### Additional Features
- Real-time voice activity logging with embeds (join/leave/switch)
- Welcome card image generation for new members
- Automatic XP rewards for message activity
- Level-based role rewards
- Ticket transcripts saved to logs
- 24/7 voice mode to keep bot connected

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **discord.js** | v14.16.3 | Discord API wrapper |
| **lavalink-client** | v2.0.0 | Remote music playback |
| **pg** | v8.13.0 | PostgreSQL client |
| **@napi-rs/canvas** | v0.1.53 | Image generation (welcome cards) |
| **dotenv** | v16.4.5 | Environment configuration |
| **Node.js** | 18+ | Runtime |
| **PostgreSQL** | 12+ | Data persistence |
| **Lavalink** | Latest | Music server (external) |

## Project Structure

```
.
├── commands/              32 slash command modules organized by feature
├── events/                5 event listeners (voice, messages, members, tickets)
├── lib/                   12 utility modules (DB, music, tickets, leveling, etc.)
├── index.js               Bot entry point and interaction handler
├── deploy-commands.js     Slash command registration script
├── package.json           Dependencies and npm scripts
└── .env.example           Environment configuration template
```

**Directory Details:**

- **`commands/`** — Slash command definitions (music, moderation, leveling, tickets, setup)
- **`events/`** — Discord event listeners (voiceStateUpdate, messageCreate, guildMemberAdd, ready, ticketInteractions)
- **`lib/`** — Reusable modules for database access, music management, ticket persistence, leveling, welcome cards, etc.
- **`index.js`** — Bot initialization, command/event loading, interaction routing
- **`deploy-commands.js`** — Registers all slash commands with Discord (run after adding commands)

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- PostgreSQL 12 or higher
- A Discord bot application and token ([Create one here](https://discord.com/developers/applications))
- A Lavalink server for music playback

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adityarajx11/DC-Bot.git
   cd DC-Bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment configuration**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   
   Edit `.env` and set the following required variables:
   ```
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   DATABASE_URL=postgresql://user:password@localhost:5432/raven_db
   LAVALINK_HOST=your-lavalink-host.com
   LAVALINK_PORT=443
   LAVALINK_PASSWORD=your_lavalink_password
   LAVALINK_SECURE=true
   ```
   
   Optional variables:
   ```
   GUILD_ID=your_test_guild_id      # For dev deploys only (faster than global)
   ```

5. **Deploy slash commands to Discord**
   ```bash
   npm run deploy
   ```
   This registers all commands with Discord. Re-run after adding or modifying commands.

6. **Start the bot**
   ```bash
   npm start
   ```

The bot will connect to Discord and load all commands and events. Check console for startup confirmation.

## Commands

### Music (11 commands)
Requires voice channel connection. Music powered by Lavalink (supports YouTube, SoundCloud, Spotify, and more).

| Command | Description |
|---------|-------------|
| `/play <song>` | Search by name or paste YouTube URL to play or queue |
| `/pause` | Pause current track |
| `/resume` | Resume paused track |
| `/skip` | Skip to next track in queue |
| `/stop` | Stop playback and leave voice |
| `/queue` | Display current queue with position |
| `/shuffle` | Randomize queue order |
| `/loop` | Cycle loop mode (off → track → queue) |
| `/volume <0-100>` | Adjust volume percentage |
| `/nowplaying` | Show current track with control buttons |
| `/247` | Enable 24/7 mode (bot stays connected) |

### Moderation (7 commands)
All moderation actions generate case numbers and are logged to the database.

| Command | Description |
|---------|-------------|
| `/ban <user> [reason]` | Ban user and log case |
| `/bulkban <users...>` | Ban multiple users in one command |
| `/kick <user> [reason]` | Kick user from server |
| `/warn <user> [reason]` | Issue formal warning (logged) |
| `/note <user> <note>` | Add private mod note |
| `/cases <user>` | View all moderation history for user |
| `/mylist [action]` | Create and manage custom ban/watch lists |

### Leveling (3 commands)
Members earn XP from messages. Configure role rewards and announcements.

| Command | Description |
|---------|-------------|
| `/rank [user]` | Show user's XP, level, and server rank |
| `/leaderboard` | Display top 10 XP earners |
| `/levelconfig [subcommand]` | Admin: set announcement channel and role rewards |

### Tickets (2 commands)
Full ticket lifecycle with staff claims, priority levels, and transcripts.

| Command | Description |
|---------|-------------|
| `/ticketsetup [subcommand]` | Admin: configure ticket system |
| `/ticketpanel` | Create a message with ticket creation button |

### Server Setup (9 commands)
Configure features like voice alerts, welcome messages, auto-roles, and self-assignable roles.

| Command | Description |
|---------|-------------|
| `/setup voicelog <channel>` | Enable voice join/leave alerts in channel |
| `/setup youtube <channel_id> <alert_channel>` | YouTube live notification alerts |
| `/setup welcome <channel> <message>` | Welcome messages for new members |
| `/setup autorole <role>` | Auto-assign role to new members |
| `/setup selfroleadd <role> <category>` | Add role to self-assignable category |
| `/setup selfroleremove <role>` | Remove from self-assignable roles |
| `/setup show` | Display current server settings |
| `/setup disable <feature>` | Turn off a feature |
| `/roles` | List all self-assignable roles |
| `/join` | Manual voice channel join |
| `/leave` | Manual voice channel leave |
| `/remind <time> <message>` | Schedule a personal reminder |

## Database

RAVEN uses PostgreSQL for all persistent data. The database automatically initializes on first run with the following schema:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `mod_cases` | Moderation case log | guild_id, case_number, action, target_id, reason, created_at |
| `mod_notes` | Private mod notes | guild_id, user_id, note, added_by, created_at |
| `user_xp` | Member leveling data | guild_id, user_id, xp, level, last_message_at |
| `level_roles` | Level-based role rewards | guild_id, level, role_id |
| `level_config` | Leveling settings | guild_id, channel_id, message_template |
| `guild_settings` | Server configuration | guild_id, voice_log_channel_id, youtube_channel_id, welcome_channel_id, auto_role_id, self_role_categories, stay_247 |
| `guild_case_counters` | Case number tracking | guild_id, last_case_number |

## Roadmap

RAVEN is evolving into a modular bot family. Future releases will include specialized standalone bots for music management, advanced leveling systems, and enhanced security features.

## Permissions

For full functionality, grant your bot these Discord permissions:

- **Send Messages** — post commands, alerts, and logs
- **Embed Links** — display formatted embeds
- **Read Message History** — fetch messages for leveling/tickets
- **Manage Channels** — create ticket channels
- **Manage Roles** — assign auto-roles and level rewards
- **Connect** / **Speak** — voice channel operations (music, alerts)
- **Deafen Members** — music playback control

Adjust permissions via Discord Developer Portal or OAuth2 invite URL.

## Development

### Adding Commands
1. Create a new `.js` file in `commands/` folder
2. Export an object with `data` (SlashCommandBuilder) and `execute` (async function)
3. Run `npm run deploy` to register with Discord
4. Restart the bot

### Adding Event Listeners
1. Create a new `.js` file in `events/` folder
2. Export an object with `name` (event name) and `execute` (async function)
3. Restart the bot (no deploy needed)

### Example Command Structure
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('What my command does')
    .addStringOption(opt => opt.setName('param').setDescription('A parameter')),
  
  async execute(interaction) {
    await interaction.reply('Response here');
  }
};
```

## Troubleshooting

**Bot won't start / can't connect to Lavalink**
- Verify `LAVALINK_HOST`, `LAVALINK_PORT`, and `LAVALINK_PASSWORD` are correct
- Ensure Lavalink server is running and reachable
- Check bot logs for connection errors

**Music commands fail or no sound**
- Verify bot is connected to voice channel
- Ensure Lavalink node is healthy
- Check that search query returns valid results

**Leveling not working**
- Verify `DATABASE_URL` is set and PostgreSQL is running
- Ensure `messageCreate` event is loaded (check console on startup)
- Check that level config is set via `/levelconfig`

**Tickets not creating**
- Run `/ticketsetup category` to set the category channel
- Run `/ticketsetup staffrole` to set staff role
- Verify bot has `Manage Channels` permission

**Slash commands not appearing**
- Run `npm run deploy` after adding/changing commands
- Wait up to 1 hour for global commands to propagate
- For instant testing, use `GUILD_ID` in `.env` for guild-scoped deploys

**Welcome messages not sending**
- Run `/setup show` to verify welcome channel is configured
- Check bot has `Send Messages` permission in that channel
- Verify `guildMemberAdd` event is loaded

## License

MIT License — see [LICENSE](./LICENSE) file or add one if publishing.

---

**Built and maintained by [Adityarajx11](https://github.com/Adityarajx11)**
