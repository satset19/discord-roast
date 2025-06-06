const express = require("express");
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const config = require("./config");
const roastService = require("./services/roastService");
const modelService = require("./services/modelService");
//okeokeoek
// Create Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Verify required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error("FATAL: DISCORD_TOKEN environment variable is required");
  process.exit(1);
}

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Startup state tracking
let startupState = {
  isReady: false,
  httpReady: false,
  discordReady: false,
  startupTime: Date.now(),
};

// Extended initialization timeout (2 minutes)
const MAX_STARTUP_TIME = 120000;

// Mark HTTP as ready when server starts
server.on("listening", () => {
  startupState.httpReady = true;
  console.log("HTTP server ready");
});

// Final readiness check
setInterval(() => {
  if (
    !startupState.isReady &&
    startupState.httpReady &&
    startupState.discordReady
  ) {
    startupState.isReady = true;
    console.log("Application fully initialized");
  }
}, 5000);

// Enhanced logger function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Setup health check endpoint after client initialization
app.get("/health", (req, res) => {
  const uptime = Date.now() - startupState.startupTime;
  const status = {
    status: startupState.isReady ? "healthy" : "initializing",
    uptime: `${Math.floor(uptime / 1000)}s`,
    components: {
      http: startupState.httpReady,
      discord: startupState.discordReady,
    },
  };

  if (startupState.isReady) {
    res.status(200).json(status);
  } else if (uptime > MAX_STARTUP_TIME) {
    res.status(500).json({
      ...status,
      error: "Startup timeout exceeded",
    });
  } else {
    res.status(503).json(status);
  }
});

// Initialize Discord client first
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences, // INI WAJIB
    GatewayIntentBits.MessageContent,
  ],
});

// Setup Discord event listeners right after initialization
client.on("ready", () => {
  client.user.setPresence({
    activities: [
      {
        name: "Victim",
        type: ActivityType.Playing, // Listening to help
      },
    ],
    status: "online",
  });
  startupState.discordReady = true;
  console.log("Discord client ready");
  log(`=== BOT STARTED ===`);
  log(`Logged in as ${client.user.tag}`);
  log(`Guild count: ${client.guilds.cache.size}`);
});

client.on("guildCreate", async (guild) => {
  log(`[DEBUG] New guild joined: ${guild.name} (${guild.id})`);
  try {
    const googleSheetService = require("./services/googleSheetService");
    const { deployCommands } = require("../deploy-commands");

    // 1. Add guild to tracking sheet
    log("[DEBUG] Registering guild...");
    const added = await googleSheetService.addGuildIfNotExists(
      guild.id,
      guild.name
    );

    if (added) {
      log(`✅ Added new guild to sheet: ${guild.name} (${guild.id})`);

      // 2. Check if commands need deployment
      const commandsDeployed = await googleSheetService.checkCommandsDeployed(
        guild.id
      );
      if (!commandsDeployed) {
        log("[DEBUG] Deploying commands...");
        await deployCommands(guild.id);

        // 3. Update deployment status
        await googleSheetService.updateCommandsDeployed(guild.id, true);
        log(`✅ Commands deployed to ${guild.name}`);
      } else {
        log(`ℹ️ Commands already deployed to ${guild.name}`);
      }
    } else {
      log(`ℹ️ Guild already exists in sheet: ${guild.name}`);
    }
  } catch (error) {
    log(`❌ Error handling new guild: ${error.message}`);
  }
});

client.on("interactionCreate", async (interaction) => {
  log(`Interaction received: ${interaction.id}`);
  if (!interaction.isCommand()) return;

  if (!interaction.guild) {
    return await interaction.reply("This command only works in servers!");
  }

  let member;
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
    log(`❌ Error fetching user: ${error.message}`);
    return await interaction.reply(
      "Failed to fetch user data. Please try again later."
    );
  }
  // console.log(member.presence?.activities);
  const userData = {
    username: member.user.username,
    activities: member.presence?.activities?.map((a) => a.name) || [],
    roles: member.roles.cache
      .map((r) => r.name)
      .filter((n) => n !== "@everyone"),
    daysInServer: Math.floor(
      (Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)
    ),
  };

  try {
    // Defer reply immediately to ensure we can edit it later
    await interaction.deferReply();

    const topic =
      interaction.commandName === "roast"
        ? interaction.options.getString("topic") || "general"
        : null;

    const { text: roast, nickname } = await roastService.generateRoast(
      userData,
      interaction.user.username,
      topic
    );

    // Apply nickname if possible
    if (
      nickname &&
      interaction.guild.members.me?.permissions.has("ManageNicknames")
    ) {
      const cleanNickname = nickname
        .replace(/[^\w\s]/g, "")
        .trim()
        .slice(0, 32);
      await member.setNickname(cleanNickname).catch(log);
    }

    let replyContent;
    switch (interaction.commandName) {
      case "roastme":
        replyContent = `<@${interaction.user.id}>, ${roast}`;
        break;
      default:
        replyContent = `<@${member.id}>, ${roast}`;
    }

    await interaction.editReply(
      replyContent || "Gagal membuat roast, coba lagi nanti ya! interaction"
    );
  } catch (error) {
    log(`❌ Command error: ${error.message}`);
    // We can safely edit here since we deferred earlier
    await interaction.editReply(
      "Failed to generate roast. Please try again later."
    );
  }
});

client.on("messageCreate", async (message) => {
  log(`Message received from ${message.author.tag}`);
  // Ignore messages from bots
  if (message.author.bot) return;

  try {
    // Debug log full message content
    log(`DEBUG: Full message content - ${message.content}`);
    log(`DEBUG: Mentions count - ${message.mentions.users.size}`);

    // Check all user mentions in message
    if (message.mentions.users.size > 0) {
      const mentionedUsers = message.mentions.users.map((user) => ({
        id: user.id,
        tag: user.tag,
        isBot: user.bot,
      }));
      log(`MENTIONS DETAIL:`, JSON.stringify(mentionedUsers, null, 2));

      // Handle bot mentions
      const botWasMentioned = message.mentions.has(client.user.id);
      log(`DEBUG: Bot mentioned? ${botWasMentioned}`);

      if (botWasMentioned) {
        const guildInfo = message.guild
          ? `Guild: ${message.guild.name} (${message.guild.id})`
          : "DM";
        log(`BOT MENTION DETAIL: ${guildInfo} by ${message.author.tag}`);
        log(`FULL MESSAGE: ${message.content}`);

        const content = message.content
          .replace(`<@${message.guild.id}>`, "")
          .trim();

        const [target, ...topicParts] = content.split(" ");
        const topic = target.includes("<@")
          ? topicParts.join(" ")
          : message.content;

        console.log("Topic:", topic);
        console.log("Target:", message.author.tag);

        const userData = {
          username: target.startsWith("@") ? target : message.author.username,
          activities: [],
          roles: [],
          daysInServer: Math.floor(
            (Date.now() - message.author.createdAt) / (1000 * 60 * 60 * 24)
          ),
        };

        const { text: roastText } = await roastService.generateRoast(
          userData,
          message.author.tag,
          topic,
          botWasMentioned
        );
        return await message.reply(roastText);
      }
    }
  } catch (error) {
    log(`❌ Message handling error: ${error.message}`);
  }
});

// Initialize Discord client with retry logic
let discordRetries = 0;
const maxDiscordRetries = 3;

async function initializeDiscord() {
  try {
    console.log("Attempting Discord login...");
    await client.login(process.env.DISCORD_TOKEN || config.discord.token);
    console.log("Discord client logged in successfully");
  } catch (err) {
    discordRetries++;
    if (discordRetries <= maxDiscordRetries) {
      console.error(
        `Discord login failed (attempt ${discordRetries}/${maxDiscordRetries}):`,
        err.message
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return initializeDiscord();
    }
    console.error("FATAL: Failed to login to Discord after multiple attempts");
    process.exit(1);
  }
}

// Start Discord client after short delay to ensure HTTP server is ready
setTimeout(() => {
  initializeDiscord();
}, 1000);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  client.destroy();
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  client.destroy();
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
