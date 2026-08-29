# DC-Bot

A starter Discord bot with voice alerts, a mass-DM utility, and a modular command/event structure so you can extend it with music, moderation, tickets, and other features.

---

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Configuration (.env)](#configuration-env)
- [Available commands](#available-commands)
- [Permissions](#permissions)
- [Project structure](#project-structure)
- [Development](#development)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 🔊 Voice join/leave/switch alerts (posts an embed in a configured text channel)
- 📨 `/massdm` — owner/admin-only command to DM every human member in the server
- ⚙️ Modular commands and events: add files under `/commands` and `/events` to extend
- 🎵 Example hooks for music playback (see `/lib` for helpers)
- ✅ Simple deploy script to register slash commands

## Requirements

- Node.js 18+ (or the version required by your dependencies)
- A Discord bot application and token
- Bot must have appropriate permissions in your server (see Permissions section)

## Quickstart

1. Clone the repository

```bash
git clone https://github.com/adixlucifer0011/DC-Bot.git
cd DC-Bot
```

2. Install dependencies

```bash
npm install
```

3. Copy the example environment file and fill in values

```bash
cp .env.example .env
# Then edit .env and set BOT_TOKEN, CLIENT_ID, GUILD_ID, VOICE_LOG_CHANNEL_ID, OWNER_IDS, etc.
```

4. Register slash commands and start the bot

```bash
npm run deploy   # registers slash commands (e.g., /massdm)
npm start        # starts the bot
```

Notes:
- Re-run `npm run deploy` after adding or changing command files so Discord updates slash commands.

## Configuration (.env)

Set the following (examples):

```
BOT_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_guild_id
VOICE_LOG_CHANNEL_ID=channel_id_for_voice_logs
OWNER_IDS=comma,separated,owner,ids
```

Environment variables are read from `.env` at startup. Keep your bot token secret and do not commit it to source control.

## Available commands (examples)

- `/massdm` — DM all human members (owner/admin restricted)
- Voice alerts are automatic once `VOICE_LOG_CHANNEL_ID` is set and the bot has the required permissions

If you add new command files under `/commands`, re-run `npm run deploy` to register them with Discord.

## Permissions

For voice alerts and basic command functionality, the bot typically needs:

- Send Messages
- Embed Links
- Read Message History
- Connect / Speak (if you add voice/music features)

Adjust permissions in the OAuth2 bot invite URL when adding the bot to your guild.

## Project structure

- /commands — Slash command modules
- /events — Event handlers (e.g., voiceStateUpdate.js)
- /lib — Shared libraries and helpers (e.g., musicManager.js)
- index.js / main bot entry — boots the client and loads commands/events

## Development

- Add new files to `/commands` or `/events` following the existing patterns.
- Use `npm run deploy` to push command changes to Discord (dev vs global deploy depends on scripts).
- Use console logging and the `DEBUG` environment variable or a logger if present to troubleshoot.

## Changelog

- 2026-08-28 — Fixed invalid URL bug in music playback (defensive checks & logging)

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a feature branch
3. Open a Pull Request with a clear description of changes

Please include tests or usage notes for non-trivial changes.

## License

MIT — see LICENSE (if present) or add one if you want to publish this project.
