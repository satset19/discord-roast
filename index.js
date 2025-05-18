const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();
const roastService = require("./src/services/roastService");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
// console.log("Starting bot...", TOKEN, CLIENT_ID);

const commandLoader = require("./src/utils/commandLoader");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
  try {
    await commandLoader.deployCommands(guild.id);
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);
  } catch (error) {
    console.error(`Failed to deploy commands to new guild ${guild.id}:`, error);
  }
});

client.on("interactionCreate", async (interaction) => {
  // console.log("Interaction received:", interaction);
  if (!interaction.isCommand()) return;

  const member = await interaction.guild.members.fetch(
    interaction.commandName === "roastme"
      ? interaction.user.id
      : interaction.options.getUser("target").id
  );
  let roaster;
  try {
    roaster =
      interaction.commandName !== "roastme"
        ? await interaction.guild.members.fetch(interaction.user.id)
        : null;
  } catch (error) {
    console.error("Error fetching roaster:", error);
    roaster = null;
  }

  const userData = {
    username: member.user.username,
    avatarURL: member.user.displayAvatarURL(),
    status: member.presence?.status || "offline",
    activities:
      member.presence?.activities?.map((a) => ({
        name: a.name,
        type: a.type,
        details: a.details,
        state: a.state,
      })) || [],
    roles: member.roles.cache
      .map((r) => r.name)
      .filter((n) => n !== "@everyone"),
    joinDate: member.joinedAt.toLocaleDateString(),
    daysInServer: Math.floor(
      (Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)
    ),
  };

  const userDataRoaster = roaster
    ? {
        username: roaster.user.username,
        avatarURL: roaster.user.displayAvatarURL(),
        status: roaster.presence?.status || "offline",
        activities:
          roaster.presence?.activities?.map((a) => ({
            name: a.name,
            type: a.type,
            details: a.details,
            state: a.state,
          })) || [],
        roles: roaster.roles.cache
          .map((r) => r.name)
          .filter((n) => n !== "@everyone"),
        joinDate: roaster.joinedAt.toLocaleDateString(),
        daysInServer: Math.floor(
          (Date.now() - roaster.joinedAt) / (1000 * 60 * 60 * 24)
        ),
      }
    : null;

  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply().catch((err) => {
        if (err.code !== 10062) {
          // Ignore unknown interaction errors
          throw err;
        }
      });
    }
    const { text: roast, nickname } = await roastService.generateRoast(
      userData,
      roaster?.user?.username || "Anonymous"
    );

    // Apply nickname if provided and bot has permission
    if (nickname) {
      // Clean up nickname string
      const cleanNickname = nickname
        .replace(/[^\w\s]/g, "")
        .trim()
        .slice(0, 32);

      if (interaction.guild.members.me?.permissions.has("ManageNicknames")) {
        try {
          await member.setNickname(cleanNickname);
        } catch (error) {
          console.error("Failed to set nickname:", error);
          if (error.code !== 50013) {
            // Only log non-permission errors
            console.error("Nickname change failed:", error);
          }
        }
      } else {
        console.log(
          "Skipping nickname change - missing ManageNicknames permission"
        );
      }
    }

    let replyContent;
    if (interaction.commandName === "startroast") {
      replyContent = `<@${member.id}>, ${roast}`;
    } else {
      replyContent = `<@${interaction.user.id}>, ${roast}`;
    }

    try {
      await interaction.editReply({
        content: replyContent,
        allowedMentions: { parse: ["users"] },
        flags: null, // Remove any suppress flags
      });
    } catch (editError) {
      if (!interaction.replied) {
        await interaction.followUp({
          content: replyContent,
          allowedMentions: { parse: ["users"] },
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("Failed to generate roast:", error);
    try {
      if (!interaction.replied) {
        await interaction.followUp({
          content: "Failed to generate roast. Please try again later.",
          ephemeral: true,
        });
      }
    } catch (followUpError) {
      console.error("Failed to send error message:", followUpError);
    }
  }
});

client.login(TOKEN);
