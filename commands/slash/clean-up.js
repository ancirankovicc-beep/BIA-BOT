const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const GarbageCollector = require('../../utils/garbageCollector');
const config = require('../../config');
const shiva = require('../../shiva');
const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clean-up')
        .setDescription('Forsiraj garbage collection (samo vlasnici)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            return interaction.reply({
                content: '❌ Sistemsko jezgro je offline - Komanda nedostupna',
                ephemeral: true
            }).catch(() => {});
        }

        interaction.shivaValidated = true;
        interaction.securityToken = COMMAND_SECURITY_TOKEN;

        if (!config.bot.ownerIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: '❌ Samo vlasnici bota mogu koristiti ovu komandu!',
                ephemeral: true
            });
        }

        const before = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        GarbageCollector.forceCleanup();
        const after = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        await interaction.reply({
            content: `🗑️ Čišćenje završeno!\nMemorija: ${before}MB → ${after}MB`,
            ephemeral: true
        });
    }
};
