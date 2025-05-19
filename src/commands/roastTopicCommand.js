const { SlashCommandBuilder } = require("@discordjs/builders");
const roastService = require("../services/roastService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roast")
    .setDescription("Roast a user about a specific topic")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to roast").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("topic")
        .setDescription(
          "Topic to roast about (e.g. gaming, looks, intelligence)"
        )
        .setRequired(false)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = [
      "gaming skills",
      "intelligence",
      "looks",
      "personality",
      "social media",
      "music taste",
      "fashion sense",
      "life choices",
    ];
    const filtered = choices.filter((choice) =>
      choice.toLowerCase().includes(focusedValue.toLowerCase())
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice }))
    );
  },
  async execute(interaction) {
    console.log("Roast command interaction received:", interaction);

    if (!interaction.guild) {
      return await interaction.reply("This command only works in servers!");
    }

    console.log("Roast command interaction received:", interaction.options);
    const targetUser = interaction.options.getUser("user");
    const topic = interaction.options.getString("topic") || "general";

    try {
      const member = await interaction.guild.members.fetch(targetUser.id);

      const userData = {
        username: member.user.username,
        avatarURL: member.user.displayAvatarURL(),
        status: member.presence?.status ?? "offline",
        roles: member.roles.cache
          .map((r) => r.name)
          .filter((n) => n !== "@everyone"),
        joinDate: member.joinedAt.toLocaleDateString(),
        daysInServer: Math.floor(
          (Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)
        ),
      };

      console.log("Using topic:", topic);
      const roast = await roastService.generateRoast(userData, topic);
      await interaction.reply(`${interaction.user} ${roast.text}`);
    } catch (error) {
      console.error("Error executing roast command:", error);
      await interaction.reply("Failed to roast user. Please try again later.");
    }
  },
};
