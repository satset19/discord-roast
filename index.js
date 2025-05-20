const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  Partials,
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
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.User, Partials.Message, Partials.GuildMember],
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
// console.log("Starting bot...", TOKEN, CLIENT_ID);

// Removed commandLoader as it's no longer needed

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Set initial model
  const initialModel = "deepseek"; // Change this to switch models
  try {
    roastService.setModel(initialModel);
    console.log(`Set initial model to ${initialModel}`);
  } catch (error) {
    console.error("Failed to set initial model:", error.message);
  }
});

// Removed guildCreate handler as commands are now global

client.on("interactionCreate", async (interaction) => {
  // console.log("Interaction received:", interaction);
  if (!interaction.isCommand()) return;

  if (!interaction.guild) {
    return await interaction.reply("This command only works in servers!");
  }

  let member;
  // console.log(interaction);
  try {
    const targetUserId =
      interaction.commandName === "roastme"
        ? interaction.user.id
        : interaction.options.getUser("user")?.id ||
          interaction.options.getUser("target")?.id;

    if (!targetUserId) {
      return await interaction.reply("Could not find target user!");
    }

    member = await interaction.guild.members.fetch(targetUserId);
  } catch (error) {
    console.error("Error fetching target user:", error);
    return await interaction.reply(
      "Failed to fetch user data. Please try again later."
    );
  }

  let roaster;
  try {
    roaster = ["roast", "startroast"].includes(interaction.commandName)
      ? await interaction.guild.members.fetch(interaction.user.id)
      : null;
  } catch (error) {
    console.error("Error fetching roaster:", error);
    roaster = null;
  }

  const userData = {
    userId: member.user.id,
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

    // console.log("Generating roast...", userData);
    const topic =
      interaction.commandName === "roast"
        ? interaction.options.getString("topic") || "general"
        : null;

    const { text: roast, nickname } = await roastService.generateRoast(
      userData,
      roaster?.user?.username || "Anonymous",
      topic
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
    switch (interaction.commandName) {
      case "startroast":
        replyContent = `<@${member.id}>, ${roast}`;
        break;
      case "roastme":
        replyContent = `<@${interaction.user.id}>, ${roast}`;
        break;
      case "roast":
        replyContent = `<@${member.id}>, ${roast}`;
        break;
      default:
        replyContent = roast;
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
