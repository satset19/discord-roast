const fs = require("fs");
const path = require("path");

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const deployCommands = async (guildId) => {
  const commands = loadCommands();
  const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`Deploying commands to guild ${guildId}`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: commands }
    );
    console.log(`Successfully deployed commands to guild ${guildId}`);
  } catch (error) {
    console.error(`Failed to deploy commands to guild ${guildId}:`, error);
    throw error;
  }
};

const loadCommands = () => {
  const commands = [];
  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (!command.data) {
        console.error(`Command ${file} is missing data property`);
        continue;
      }
      if (typeof command.data.toJSON !== "function") {
        console.error(
          `Command ${file} data is not a valid SlashCommandBuilder`
        );
        continue;
      }
      commands.push(command.data.toJSON());
    } catch (error) {
      console.error(`Error loading command ${file}:`, error);
    }
  }

  return commands;
};

module.exports = {
  loadCommands,
  deployCommands,
};
