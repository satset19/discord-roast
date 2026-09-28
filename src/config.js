require("dotenv").config();

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`FATAL: Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function getOptionalEnv(name, defaultValue = null) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  return value;
}

module.exports = {
  discord: {
    token: getRequiredEnv("DISCORD_TOKEN"),
    clientId: getRequiredEnv("CLIENT_ID"),
  },
  deepseek: {
    apiKey: getRequiredEnv("DEEPSEEK_API_KEY"),
    endpoint: getOptionalEnv("DEEPSEEK_ENDPOINT", "https://api.deepseek.com/v1/chat/completions"),
    model: "deepseek-chat",
    temperature: 0.9,
  },
  proxycli: {
    apiKey: getRequiredEnv("PROXYCLI_API_KEY"),
    endpoint: getOptionalEnv("PROXYCLI_ENDPOINT", "https://proxycli.besoksenin.web.id/v1/chat/completions"),
    model: getOptionalEnv("PROXYCLI_MODEL", "gemini-3.6-flash-high"),
    temperature: 0.7,
  },
  googleSheets: {
    spreadsheetId: getRequiredEnv("GOOGLE_SHEET_ID"),
    apiKey: getRequiredEnv("GOOGLE_PRIVATE_KEY"),
    guildsSheet: "Guilds",
  },
  giphy: {
    apiKey: getOptionalEnv("GIPHY_API_KEY", null),
    rating: getOptionalEnv("GIPHY_RATING", "pg-13"),
    limit: parseInt(getOptionalEnv("GIPHY_LIMIT", "10"), 10) || 10,
  },
  contextReply: {
    probabilities: {
      text: parseFloat(getOptionalEnv("REPLY_PROBABILITY_TEXT", "0.33")) || 0.33,
      sticker: parseFloat(getOptionalEnv("REPLY_PROBABILITY_STICKER", "0.33")) || 0.33,
      reaction: parseFloat(getOptionalEnv("REPLY_PROBABILITY_REACTION", "0.34")) || 0.34,
    },
  },
};
