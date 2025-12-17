const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'current', 'playing', 'now'],
    description: 'Prikaži trenutno puštenu pesmu',
    securityToken: COMMAND_SECURITY_TOKEN,
    
    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ Sistemsko jezgro je offline - Komanda nedostupna')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;

        setTimeout(() => {
            message.delete().catch(() => {});
        }, 4000);
        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || !conditions.currentTrack) {
                const embed = new EmbedBuilder().setDescription('❌ Trenutno se ništa ne pušta!');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            const track = conditions.currentTrack;
            const player = conditions.player;
            
            const duration = formatDuration(track.info.length);
            const position = formatDuration(player.position);
            const statusEmoji = player.paused ? '⏸️' : '▶️';
            const loopEmoji = getLoopEmoji(player.loop);

            const embed = new EmbedBuilder().setDescription(
                `${statusEmoji} **${track.info.title}**\n` +
                `Autor: ${track.info.author}\n` +
                `⏰ ${position} / ${duration}\n` +
                `👤 <@${track.info.requester.id}>\n` +
                `🔊 Glasnoća: ${player.volume || 50}%\n` +
                `🔁 Ponavljanje: ${loopEmoji} ${player.loop || 'Isključeno'}\n` +
                `📜 Red: ${player.queue.size} pesama`
            );

            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));

        } catch (error) {
            console.error('Now playing command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ Došlo je do greške pri preuzimanju trenutne pesme!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};

function formatDuration(duration) {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getLoopEmoji(loopMode) {
    switch (loopMode) {
        case 'track': return '🔂';
        case 'queue': return '🔁';
        default: return '➡️';
    }
}
