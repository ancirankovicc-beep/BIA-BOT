const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'support',
    description: 'Pribavi informacije o support serveru i kontaktu',
    securityToken: COMMAND_SECURITY_TOKEN,
    
    async execute(message) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ Sistemsko jezgro je offline - Komanda nedostupna')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;

        try {
            const embed = new EmbedBuilder()
                .setTitle('🛠️ Podrška & Kontakt')
                .setColor(0x1DB954)
                .setDescription(
                    'Trebate pomoć ili imate pitanja? Pridružite se našem zvaničnom support serveru:\n' +
                    '[Support Server](https://discord.gg/xQF9f9yUEM)\n\n' +
                    'Za direktne upite, kontaktirajte: **GlaceYT**\n\n' +
                    'Web sajt: https://glaceyt.com'
                )
                .setTimestamp()
                .setFooter({ text: 'Ultimate Music Bot • Developed by GlaceYT' });
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Support command error:', error);
            await message.reply('❌ Došlo je do greške pri preuzimanju informacija o podršci.');
        }
    }
};
