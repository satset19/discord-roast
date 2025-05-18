const { SlashCommandBuilder } = require("@discordjs/builders");
const roastService = require("../services/roastService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("startroast")
    .setDescription("Start a roasting session")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user to roast")
        .setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const member = await interaction.guild.members.fetch(target.id);
    // console.log("Roast command interaction received:", member.presence);
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
    await interaction.reply(`${target}`);
  },
};
