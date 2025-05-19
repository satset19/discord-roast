const fs = require("fs");
const path = require("path");

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

// Removed per-guild command deployment

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
};
