const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Review a staff application')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User who applied')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Approve or deny the application')
        .setRequired(true)
        .addChoices(
          { name: 'Approve', value: 'approve' },
          { name: 'Deny', value: 'deny' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for decision')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const status = interaction.options.getString('status');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const isApprove = status === 'approve';

    const embed = new EmbedBuilder()
      .setTitle(isApprove ? 'Application Approved' : 'Application Denied')
      .setColor(isApprove ? 0x2ecc71 : 0xe74c3c)
      .addFields(
        { name: 'Reviewer', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setTimestamp();

    // DM user
    try {
      await user.send({ embeds: [embed] });
    } catch (err) {
      console.log('Could not DM user.');
    }

    await interaction.reply({
      content: `✅ Application for ${user.tag} has been **${status}d**.`,
      ephemeral: true
    });

    const logChannelId = '1496673887667228763';
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (logChannel) {
      logChannel.send({ embeds: [embed] });
    }
  }
};