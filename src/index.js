const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config");

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

client.on("guildCreate", async (guild) => {
  console.log(`[DEBUG] New guild joined: ${guild.name} (${guild.id})`);
  try {
    const googleSheetService = require("./services/googleSheetService");
    const { deployCommands } = require("../deploy-commands");

    // 1. Add guild to tracking sheet
    console.log("[DEBUG] Registering guild...");
    const added = await googleSheetService.addGuildIfNotExists(
      guild.id,
      guild.name
    );

    if (added) {
      console.log(`✅ Added new guild to sheet: ${guild.name} (${guild.id})`);

      // 2. Check if commands need deployment
      const commandsDeployed = await googleSheetService.checkCommandsDeployed(
        guild.id
      );
      if (!commandsDeployed) {
        console.log("[DEBUG] Deploying commands...");
        await deployCommands(guild.id);

        // 3. Update deployment status
        await googleSheetService.updateCommandsDeployed(guild.id, true);
        console.log(`✅ Commands deployed to ${guild.name}`);
      } else {
        console.log(`ℹ️ Commands already deployed to ${guild.name}`);
      }
    } else {
      console.log(`ℹ️ Guild already exists in sheet: ${guild.name}`);
    }
  } catch (error) {
    console.error("❌ Error handling new guild:", error);
  }
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
