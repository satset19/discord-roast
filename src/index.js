const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config");
const commandLoader = require("./utils/commandLoader");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

// Commands are now loaded globally via deploy-commands.js

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands[interaction.commandName];
  if (!command) return;

  try {
    // Set default model
    const model = "deepseek"; // Change this to switch models
    console.log("Model set to:", model);
    roastService.setModel(model);

    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

client.login(config.discord.token);
