# RAVEN (DC-Bot)

Discord bot built with **discord.js v14**, **Lavalink**, and **PostgreSQL**. CommonJS (`"type": "commonjs"`), Node 18+.

## Commands

- `npm install` — install dependencies
- `npm start` — run the bot (`node index.js`)
- `npm run deploy` — register slash commands with Discord (`node deploy-commands.js`)

## Setup gotchas

- **There is no `.env` or `.env.example` in the repo** (README's `cp .env.example .env` is stale). Create `.env` manually from the env list below.
- Config lives in `.env` via `dotenv`. `.gitignore` excludes `.env`; never commit it or put secrets in `opencode.json`.
- Required: `BOT_TOKEN`, `CLIENT_ID`, `DATABASE_URL`, `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD`, `LAVALINK_SECURE`. Optional: `GUILD_ID` (dev deploys).
- `LAVALINK_SECURE` is compared with `=== 'true'` in `lib/lavalink.js`, so it must be the literal string `true` (not `1`/`yes`).
- `DATABASE_URL` uses Postgres. `lib/db.js` enables `ssl: { rejectUnauthorized: false }` only when the URL contains `railway`.
- Lavalink is required even to start cleanly; music commands fail with "No Lavalink node connected" if it's down.

## Architecture / wiring

- **Entry point `index.js`**: loads `.env`, registers canvas fonts from `fonts/`, creates the Client, calls `attachLavalink(client)`, auto-loads every `commands/*.js` and `events/*.js`, then routes interactions by `customId` prefix (`music_`, `poll_`, `selfrole_`) to handlers in `lib/`.
- **`events/ready.js`** initializes DB tables (`initDatabase`, `initGuildSettings`, `initTickets`), starts `startLivePolling` (YouTube), and calls `initManager` (Lavalink). Schema is auto-created on startup — **there are no migration files**; add tables via these `init*` functions.
- **Music = Lavalink.** `commands/play.js` uses `lib/lavalink.js` (`searchTrack`, `getOrCreatePlayer`); `lib/musicButtons.js` builds now-playing embeds/controls via the Lavalink manager.
- **`lib/musicManager.js` is dead legacy code.** It imports `@discordjs/voice` and `play-dl`, which are **not in `package.json`**, and nothing requires it. Do not extend or import it; removing it is safe. (`@discordjs/voice`/`play-dl` are never installed, so it would crash on load.)

## Conventions

- CommonJS `require`/`module.exports` — never ESM.
- Slash commands in `commands/*.js` export `{ data: SlashCommandBuilder, execute(interaction, client) }`, filename matching `data.name`. **Run `npm run deploy` after adding/modifying commands**, then restart the bot.
- Events in `events/*.js` export `{ name, once?, execute(...args, client) }`. No deploy needed; restart the bot.
- `deploy-commands.js` exits cleanly (code 0) if the `commands/` dir is missing or `BOT_TOKEN`/`CLIENT_ID` are unset; when `GUILD_ID` is set it deploys globally **and clears guild-scoped commands** to avoid duplicates.
- Interactions: check `interaction.replied || interaction.deferred` before `reply` vs `followUp`; keep user-facing errors ephemeral.
- State lives in Postgres via `lib/db.js` (moderation, leveling) and `lib/guildSettings.js` (per-guild config, JSONB `self_role_categories`). New persistent features should follow that pattern.
- Reminders (`commands/remind.js`) use `lib/reminders.js` `parseDuration` + in-memory `setTimeout` — **not persisted**, reminders are lost on restart.
- Follow existing style; do not add comments unless the surrounding code uses them.

## Provider config

`opencode.json` adds NVIDIA NIM as a custom OpenAI-compatible provider (`@ai-sdk/openai-compatible`, base `https://integrate.api.nvidia.com/v1`), reading `NVIDIA_API_KEY` from env. DeepSeek is a built-in provider reading `DEEPSEEK_API_KEY`. Keys are set as Windows user-level env vars (not in the repo).