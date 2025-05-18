require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Client, GatewayIntentBits } = require("discord.js");
const commandLoader = require("./src/utils/commandLoader");

const commands = commandLoader.loadCommands();
const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    // console.log("Commands to be deployed:", commands);
    console.log("Deploying commands globally...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully deployed application (/) commands globally");
  } catch (error) {
    console.error(error);
  } finally {
    client.destroy();
  }
})();
