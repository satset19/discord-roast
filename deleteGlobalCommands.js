const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();

async function deleteGlobalCommands() {
  try {
    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

    console.log("Fetching global commands...");
    const commands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );
    console.log(commands, "cccccccccccccccccccccccccccccc");
    console.log(`Found ${commands.length} global commands to delete`);

    // Filter specific commands to delete
    const commandsToDelete = commands.filter((cmd) =>
      ["roast-user", "self-roast", "topic-roast"].includes(cmd.name)
    );

    console.log(`Deleting ${commandsToDelete.length} specified commands...`);
    await Promise.all(
      commandsToDelete.map((cmd) =>
        rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, cmd.id))
      )
    );

    console.log("Successfully deleted specified global commands");
  } catch (error) {
    console.error("Error deleting commands:", error);
  }
}

deleteGlobalCommands();
