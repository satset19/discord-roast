require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
// Load commands and services
const commands = require("./src/utils/commandLoader").loadCommands();
const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);
const googleSheetService = require("./src/services/googleSheetService");

async function deployCommands(targetGuildId = null) {
  try {
    console.log("Starting command deployment");

    // 1. Check if guild exists in sheet
    const guildId = targetGuildId;
    if (guildId) {
      const exists = await googleSheetService.checkGuildExists(guildId);
      if (exists) {
        console.log(
          `Guild ${guildId} already registered - skipping deployment`
        );
        return;
      }
    }

    // 2. Delete all global commands
    try {
      const globalCommands = await rest.get(
        Routes.applicationCommands(process.env.CLIENT_ID)
      );
      await Promise.all(
        globalCommands.map((cmd) =>
          rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, cmd.id))
        )
      );
      console.log(`Deleted ${globalCommands.length} global commands`);
    } catch (error) {
      console.error("Error deleting global commands:", error);
    }

    // 3. Only deploy commands if guild isn't registered
    if (guildId) {
      const exists = await googleSheetService.checkGuildExists(guildId);
      if (!exists) {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
          body: commands,
        });
        console.log("Successfully deployed commands");

        await googleSheetService.addGuildIfNotExists(
          guildId,
          process.env.GUILD_NAME || "Unknown Guild"
        );
      } else {
        console.log(
          `Skipping deployment - guild ${guildId} already registered`
        );
      }
    } else {
      // Deploy globally if no guild specified
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });
      console.log("Successfully deployed global commands");
    }
  } catch (error) {
    console.error("Deployment error:", error);
  }
}

deployCommands();
