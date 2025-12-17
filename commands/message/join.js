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

        if (!conditions.userInVoice) {
            const embed = new EmbedBuilder().setDescription('❌ Morate biti u glasovnom kanalu!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }

        if (!conditions.canJoinVoice) {
            const embed = new EmbedBuilder().setDescription('❌ Nemam dozvolu da se pridružim vašem glasovnom kanalu!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }

        if (conditions.hasActivePlayer && conditions.sameVoiceChannel) {
            const embed = new EmbedBuilder().setDescription('✅ Već sam u vašem glasovnom kanalu!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }

        const PlayerHandler = require('../../utils/player');
        const playerHandler = new PlayerHandler(client);
        
        await playerHandler.createPlayer(
            message.guild.id,
            message.member.voice.channelId,
            message.channel.id
        );

        const embed = new EmbedBuilder().setDescription(`✅ Pridružio sam se kanalu **${message.member.voice.channel.name}**!`);
        return message.reply({ embeds: [embed] })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));

    } catch (error) {
        console.error('Join command error:', error);
        const embed = new EmbedBuilder().setDescription('❌ Došlo je do greške pri pridruživanju glasovnom kanalu!');
        return message.reply({ embeds: [embed] })
            .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
    }
}
