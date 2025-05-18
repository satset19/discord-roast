# Discord RoastMe Bot

A bot that roasts users based on their profile when they type `/roastme`.

## Features
- Roasts based on username, avatar, status, roles, and join date
- Randomly combines 2-3 roasts per command
- Easy slash command setup

## Security Warning
Never commit your actual .env file to version control! The .env.example is just a template.

## Setup

1. Create a Discord bot at https://discord.com/developers/applications
2. Clone this repository
3. Copy .env.example to .env and fill in your actual credentials
4. Install dependencies:
```bash
npm install
```
4. Create `.env` file with these variables:
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_id
```
5. Register the slash command:
```bash
node deploy-commands.js
```
6. Start the bot:
```bash
node index.js
```

## Customization
Edit `roastTemplates` in `index.js` to add your own roast messages.

## Requirements
- Node.js 16+
- Discord.js v14
