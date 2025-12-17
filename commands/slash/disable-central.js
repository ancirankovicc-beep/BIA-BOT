const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Server = require('../../models/Server');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable-central')
        .setDescription('Isključi centralni muzički sistem')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
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

        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;

        try {
            const serverConfig = await Server.findById(guildId);
            
            if (!serverConfig?.centralSetup?.enabled) {
                return interaction.editReply({
                    content: '❌ Centralni muzički sistem trenutno nije podešen!',
                    ephemeral: true
                });
            }

            try {
                const channel = await client.channels.fetch(serverConfig.centralSetup.channelId);
                const message = await channel.messages.fetch(serverConfig.centralSetup.embedId);
                await message.delete();
            } catch (error) {
                console.log('Centralni embed je već obrisan ili nedostupan');
            }

            await Server.findByIdAndUpdate(guildId, {
                'centralSetup.enabled': false,
                'centralSetup.channelId': null,
                'centralSetup.embedId': null
            });

            const embed = new EmbedBuilder()
                .setTitle('✅ Centralni Muzički Sistem Isključen')
                .setDescription('Centralni muzički sistem je isključen i embed uklonjen.')
                .setColor(0xFF6B6B)
                .setFooter({ text: 'Možete ga ponovo uključiti bilo kada sa /setup-central' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Greška pri isključivanju centralnog sistema:', error);
            
            await interaction.editReply({
                content: '❌ Došlo je do greške pri isključivanju centralnog muzičkog sistema!',
                ephemeral: true
            });
        }
    }
};
