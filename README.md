# DC-Bot

A starter Discord bot (JavaScript) that provides voice join/leave alerts, a mass-DM utility, and a modular command/event structure so you can extend it with music, moderation, tickets, and other features.

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
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- 🔊 Voice join/leave/switch alerts (posts an embed in a configured text channel)
- 📨 `/massdm` — owner/admin-only command to DM every human member in the server
- ⚙️ Modular commands and events: add files under `/commands` and `/events` to extend functionality
- 🎵 Example hooks for music playback (see `/lib` for helpers)
- ✅ Simple deploy script to register slash commands with Discord

## Requirements

- Node.js 18+ (or the version required by your dependencies)
- npm (or pnpm/yarn) to install dependencies
- A Discord bot application and token
- Bot must have appropriate permissions in your server (see Permissions section)

## Quickstart

1. Clone the repository

```bash
git clone https://github.com/Adityarajx11/DC-Bot.git
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
- If you want global commands (available in all guilds) you'll need to adjust the deploy script — local/dev deploys are faster when developing.

## Configuration (.env)

Set the following (examples):

```
BOT_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_guild_id             # optional for global deploys
VOICE_LOG_CHANNEL_ID=123456789012345678
OWNER_IDS=123456789012345678,987654321098765432
```

- OWNER_IDS should be a comma-separated list of Discord user IDs allowed to run owner-only commands like `/massdm`.
- Keep your bot token secret and never commit `.env` to source control.

## Available commands (examples)

- `/massdm` — DM all human members (owner/admin restricted)

Voice alerts are automatic once `VOICE_LOG_CHANNEL_ID` is set and the bot has the required permissions.

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

## Troubleshooting

- Bot won't join voice / no alerts: ensure `VOICE_LOG_CHANNEL_ID` is set and the bot has `View Channel` and `Send Messages` permissions for the target channel.
- Slash commands not appearing: re-run `npm run deploy` and check the deploy script's output for errors. If deploying globally, note it can take up to an hour for Discord to propagate global command changes.
- Mass DM rate limits: sending DMs to many users can hit Discord rate limits — use this feature responsibly and only for allowed moderation/administration tasks.

## Changelog

- 2026-08-28 — Fixed invalid URL bug in music playback (defensive checks & logging)

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo
2. Create a feature branch
3. Open a Pull Request with a clear description of changes

Please include tests or usage notes for non-trivial changes. When opening PRs that change commands or events, mention whether `npm run deploy` needs to be re-run.

## License

MIT — see LICENSE (if present) or add one if you want to publish this project.
