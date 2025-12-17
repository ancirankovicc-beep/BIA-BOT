const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'play',
    aliases: ['p', 'music', 'song', 'add'],
    description: 'Pusti pesmu ili dodaj u red',
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
        const PlayerHandler = require('../../utils/player');
        const ErrorHandler = require('../../utils/errorHandler');
        
        const query = args.join(' ');
        if (!query) {
            const embed = new EmbedBuilder().setDescription('❌ Molimo unesite pesmu za puštanje!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }

        try {
            const checker = new ConditionChecker(client);
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId,
                false
            );

            const errorMsg = checker.getErrorMessage(conditions, 'play');
            if (errorMsg) {
                const embed = new EmbedBuilder().setDescription(errorMsg);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            let targetVC = message.member.voice.channelId;
            if (conditions.centralEnabled && conditions.botInCentralVC && conditions.centralVC) {
                targetVC = conditions.centralVC;
            }

            const playerHandler = new PlayerHandler(client);
            const player = await playerHandler.createPlayer(
                message.guild.id,
                targetVC,
                message.channel.id
            );

            const result = await playerHandler.playSong(player, query, message.author);

            if (result.type === 'track') {
                const embed = new EmbedBuilder().setDescription(`✅ Dodato u red: **${result.track.info.title}**`);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            } else if (result.type === 'playlist') {
                const embed = new EmbedBuilder().setDescription(`✅ Dodato **${result.tracks}** pesama iz playliste: **${result.name}**`);
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            } else {
                const embed = new EmbedBuilder().setDescription('❌ Nema rezultata za vaš upit!');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

        } catch (error) {
            const embed = new EmbedBuilder().setDescription('❌ Došlo je do greške pri pokušaju puštanja muzike!');
            console.error('Play command error:', error);
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};
