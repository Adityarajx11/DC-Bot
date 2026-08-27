# My Discord Bot — Starter (Voice Alerts + Mass DM)

This is the foundation for your custom bot. It's structured so you can drop in
more features later (tickets, mod panel, TTS, music) as new files in
`/commands` and `/events` without touching the core.

## What's included
- 🔊 **Voice join/leave/switch alerts** — posts an embed in a chosen text channel
  whenever someone joins, leaves, or switches voice channels.
- 📨 **`/massdm`** — owner/admin-only command to DM every human member in the server.

## 1. Create the bot application
1. Go to https://discord.com/developers/applications → **New Application**
2. Go to **Bot** tab → click **Reset Token** → copy it (this is your `BOT_TOKEN`)
3. Under **Privileged Gateway Intents**, enable:
   - Server Members Intent
   - Message Content Intent (optional, only needed if you add text-based features later)
4. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Embed Links`, `View Channels`, `Read Message History`
   - Copy the generated URL and open it to invite the bot to your server

## 2. Get your IDs
Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then:
- Right-click your server icon → **Copy Server ID** → `GUILD_ID`
- Right-click your bot's application in the Developer Portal → **Application ID** → `CLIENT_ID`
- Right-click the text channel for voice logs → **Copy Channel ID** → `VOICE_LOG_CHANNEL_ID`
- Right-click your own username → **Copy User ID** → `OWNER_IDS` (comma-separate for multiple)

## 3. Configure
```bash
cp .env.example .env
```
Fill in `BOT_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `VOICE_LOG_CHANNEL_ID`, `OWNER_IDS` in `.env`.

## 4. Install & run
```bash
npm install
npm run deploy   # registers the /massdm slash command
npm start        # starts the bot
```

## Notes
- YouTube link previews (like the "Rapid Panel" video card you saw) are **native
  Discord behavior** — any youtu.be/youtube.com link auto-embeds. No bot code needed.
- To add a new command: create a file in `/commands` following the pattern in
  `massdm.js`, then run `npm run deploy` again.
- To add a new event: create a file in `/events` following the pattern in
  `voiceStateUpdate.js`.
