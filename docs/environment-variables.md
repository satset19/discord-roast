# Environment Variables Documentation

This document describes all required and optional environment variables used by the Discord Roast Bot.

---

## Required Variables

These variables are required for the application to boot. If any of these are missing, the bot exits with status code 1.

1. DISCORD_TOKEN
   - Type: String
   - Description: Bot authentication token obtained from the Discord Developer Portal.

2. CLIENT_ID
   - Type: String
   - Description: Application/Client ID of the Discord bot.

3. DEEPSEEK_API_KEY
   - Type: String
   - Description: API Key for accessing DeepSeek chat completion models via the configured proxy endpoint.

4. GOOGLE_SHEET_ID
   - Type: String
   - Description: The Google Spreadsheet ID used to track joined guilds and command deployment status.

5. GOOGLE_PRIVATE_KEY
   - Type: String
   - Description: Google Service Account private key in PEM format.

6. GOOGLE_SERVICE_ACCOUNT_EMAIL
   - Type: String
   - Description: Google Service Account email address associated with the service credentials.

7. PROXYCLI_API_KEY
   - Type: String
   - Description: API Key for the ProxyCLI endpoint used for contextual replies and context analysis (separate from DeepSeek API key).

---

## Optional Variables

These variables customize bot behavior and features. If omitted, sensible defaults are used.

1. GIPHY_API_KEY
   - Type: String
   - Default: null
   - Description: API Key from Giphy Developers (https://developers.giphy.com). Required to enable the animated sticker response modality. If not set, sticker modality is disabled and probability is shared between text and reaction.

2. GIPHY_RATING
   - Type: String
   - Default: "pg-13"
   - Description: Content rating filter for Giphy stickers ("g", "pg", "pg-13", "r").

3. GIPHY_LIMIT
   - Type: Number
   - Default: 10
   - Description: Maximum number of sticker search results to fetch before randomly selecting one.

4. REPLY_PROBABILITY_TEXT
   - Type: Float
   - Default: 0.33
   - Description: Relative probability weight for contextual text responses.

5. REPLY_PROBABILITY_STICKER
   - Type: Float
   - Default: 0.33
   - Description: Relative probability weight for Giphy animated sticker responses.

6. REPLY_PROBABILITY_REACTION
   - Type: Float
   - Default: 0.34
   - Description: Relative probability weight for Discord emoji reaction responses.

7. PORT
   - Type: Number
   - Default: 8000
   - Description: HTTP server port used for health check endpoint (/health).

8. DEEPSEEK_ENDPOINT
   - Type: String
   - Default: "https://api.deepseek.com/v1/chat/completions"
   - Description: Override URL for the DeepSeek API endpoint used for roast generation (rough, harsh responses).

9. PROXYCLI_ENDPOINT
   - Type: String
   - Default: "https://proxycli.besoksenin.web.id/v1/chat/completions"
   - Description: Override URL for the ProxyCLI endpoint used for contextual replies and context analysis.

10. PROXYCLI_MODEL
    - Type: String
    - Default: "claude-sonnet-4-6"
    - Description: Model name to use on the ProxyCLI endpoint.
