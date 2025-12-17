const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Prikaži red pesama')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Broj stranice reda')
                .setMinValue(1)
                .setRequired(false)
        ),
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

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder().setDescription('❌ Trenutno se ništa ne pušta!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const player = conditions.player;
            const queue = player.queue;
            const currentTrack = player.current;

            if (!currentTrack && queue.size === 0) {
                const embed = new EmbedBuilder().setDescription('📜 Red je prazan!');
                return interaction.editReply({ embeds: [embed] })
                    .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
            }

            const page = interaction.options.getInteger('page') || 1;
            const songsPerPage = 15;
            const startIndex = (page - 1) * songsPerPage;
            const endIndex = startIndex + songsPerPage;
            const totalPages = Math.ceil(queue.size / songsPerPage);

            let description = '';

            if (currentTrack) {
                const duration = formatDuration(currentTrack.info.length);
                description += `🎵 **Sada se pušta**\n**${currentTrack.info.title}**\nAutor: ${currentTrack.info.author}\nTrajanje: ${duration}\nZahtevao: <@${currentTrack.info.requester.id}>\n\n`;
            }

            if (queue.size > 0) {
                const queueTracks = Array.from(queue).slice(startIndex, endIndex);
                if (queueTracks.length > 0) {
                    description += `📋 **Sledeće (${queue.size} pesama)**\n`;
                    description += queueTracks.map((track, index) => {
                        const position = startIndex + index + 1;
                        const duration = formatDuration(track.info.length);
                        return `\`${position}.\` **${track.info.title}** \`[${duration}]\`\nZahtevao: <@${track.info.requester.id}>`;
                    }).join('\n\n');
                }

                if (totalPages > 1) {
                    description += `\n\nStrana ${page}/${totalPages}`;
                } else {
                    description += `\n\nUkupno: ${queue.size} pesama u redu`;
                }
            }

            const embed = new EmbedBuilder().setDescription(description);
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 10000));

        } catch (error) {
            console.error('Queue command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ Došlo je do greške pri preuzimanju reda!');
            return interaction.editReply({ embeds: [embed] })
                .then(() => setTimeout(() => interaction.deleteReply().catch(() => {}), 3000));
        }
    }
};

function formatDuration(duration) {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
