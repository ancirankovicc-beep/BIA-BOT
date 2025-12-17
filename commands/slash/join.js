const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Pridruži se tvom glasovnom kanalu'),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ Sistemsko jezgro je offline - Komanda nedostupna')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            if (!conditions.userInVoice) {
                const embed = new EmbedBuilder().setDescription('❌ Morate biti u glasovnom kanalu!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            if (conditions.hasActivePlayer && conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('✅ Već sam u vašem glasovnom kanalu!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const PlayerHandler = require('../../utils/player');
            const playerHandler = new PlayerHandler(client);

            await playerHandler.createPlayer(
                interaction.guild.id,
                interaction.member.voice.channelId,
                interaction.channel.id
            );

            const embed = new EmbedBuilder().setDescription(`✅ Pridružio sam se kanalu **${interaction.member.voice.channel.name}**!`);
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));

        } catch (error) {
            console.error('Join command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ Došlo je do greške pri pokušaju pridruživanja glasovnom kanalu!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};
