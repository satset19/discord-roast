# Discord RoastMe Bot

A toxic kampung-kota style roast bot that roasts users hard with no comfort or advice. Built with Discord.js and Deepseek AI.

## Features

- Toxic, rough and sharp roasts in 60% English, 40% Jaksel-style
- Roasts based on:
  - Username and avatar
  - Activities/status
  - Roles
  - Join date
  - Useless vibes
- Edgy humor with sarcasm, racial and cultural jabs
- Automatic nickname assignment
- Google Sheets integration for guild tracking
- Health check endpoint for deployment monitoring

## Commands

### `/roastme`
Roasts yourself with random insults based on your profile.

### `/roast @user [topic]`
Roasts another user with optional topic focus.

### `/roasttopic [topic]`
Roasts with a specific topic focus.

## Setup

### Requirements
- Node.js 18+
- Discord.js v14
- Google Sheets API access
- Deepseek API key

### Installation
1. Create a Discord bot at https://discord.com/developers/applications
2. Clone this repository
3. Install dependencies:
```bash
npm install
```

### Environment Variables
Create `.env` file with these variables:
```env
# Discord
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id

# Deepseek AI
DEEPSEEK_API_KEY=your_api_key

# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_API_KEY=your_api_key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key

# Optional
PORT=3000 # For health checks
```

### Register Commands
```bash
node deploy-commands.js
```

### Running
Development:
```bash
npm run dev
```

Production (with PM2):
```bash
npm run prod
```

## Deployment

### Koyeb
1. Set all required environment variables in Koyeb dashboard
2. Deploy using the production script
3. Health check endpoint: `GET /health`

The bot requires:
- Node.js 18+
- Port 3000 exposed
- All environment variables set

## Google Sheets Integration
The bot automatically:
- Tracks guilds that add it
- Logs command deployments
- Stores guild information in a sheet named "Guilds"

## Health Checks
The bot exposes a health check endpoint:
```
GET /health
```
Returns:
- 200 OK when healthy
- 503 when initializing

## Warning
This bot uses edgy humor and a bit sarcasm. Use at your own discretion.
