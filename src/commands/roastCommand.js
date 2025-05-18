const { SlashCommandBuilder } = require("@discordjs/builders");
const roastService = require("../services/roastService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roastme")
    .setDescription("Get roasted based on your profile"),
  async execute(interaction) {
    console.log("Roast command interaction received:", interaction);
    const member = await interaction.guild.members.fetch(interaction.user.id);
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

    const roast = await roastService.generateRoast(userData);
    await interaction.reply(roast);
  },
};
