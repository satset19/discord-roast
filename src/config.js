require("dotenv").config();

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN || "",
    clientId: process.env.CLIENT_ID || "",
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    temperature: 0.9,
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    apiKey: process.env.GOOGLE_API_KEY,
    guildsSheet: "Guilds",
  },
};
