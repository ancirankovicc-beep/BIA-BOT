const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'Prikaži sve dostupne komande',
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

        try {
            const msgCommandsPath = path.join(__dirname, '..', 'message');
            const msgFiles = fs.readdirSync(msgCommandsPath).filter(file => file.endsWith('.js'));
            const messageCommands = msgFiles.map(file => {
                const cmd = require(path.join(msgCommandsPath, file));
                return { name: cmd.name || 'Unknown', description: cmd.description || 'No description' };
            });

            const slashCommandsPath = path.join(__dirname, '..', 'slash');
            const slashFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
            const slashCommands = slashFiles.map(file => {
                const cmd = require(path.join(slashCommandsPath, file));
                return {
                    name: cmd.data?.name || 'Unknown',
                    description: cmd.data?.description || 'No description'
                };
            });

            let description = `**🌐 Statistika Bota:** Bot servira u **${client.guilds.cache.size}** servera.\n\n`;

            description += `**💬 Komande putem poruka [${messageCommands.length}]:**\n`;
            messageCommands.forEach(cmd => {
                description += `- \`!${cmd.name}\` - ${cmd.description}\n`;
            });

            description += `\n**⚡ Slash Komande [${slashCommands.length}]:**\n`;
            slashCommands.forEach(cmd => {
                description += `- \`/${cmd.name}\` - ${cmd.description}\n`;
            });

            if (description.length > 4096) {
                description = description.slice(0, 4093) + '...';
            }

            const embed = new EmbedBuilder()
                .setTitle('📖 Ultimate Music Bot - Spisak komandi')
                .setColor(0x1DB954)
                .setDescription(description)
                .setFooter({ text: 'Developed by GlaceYT | https://glaceyt.com' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Help command error:', error);
            await message.reply('❌ Došlo je do greške pri preuzimanju komandi.');
        }
    }
};
