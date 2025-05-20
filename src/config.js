require("dotenv").config();

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`FATAL: Missing required environment variable: ${name}`);
    process.exit(1);
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
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    temperature: 0.9,
  },
  googleSheets: {
    spreadsheetId: getRequiredEnv("GOOGLE_SHEET_ID"),
    apiKey: getRequiredEnv("GOOGLE_PRIVATE_KEY"),
    guildsSheet: "Guilds",
  },
};
