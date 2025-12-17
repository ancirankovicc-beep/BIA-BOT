const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const Server = require('../models/Server');

class CentralEmbedHandler {
    constructor(client) {
        this.client = client;
    }

    validateThumbnail(thumbnail) {
        if (!thumbnail || typeof thumbnail !== 'string' || thumbnail.trim() === '') {
            return null;
        }
        try {
            new URL(thumbnail);
            return thumbnail;
        } catch {
            return null;
        }
    }

    async createCentralEmbed(channelId, guildId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            
            const embed = new EmbedBuilder()
            .setAuthor({ name: 'Ultimate Muzički Kontrolni Centar', iconURL: 'https://cdn.discordapp.com/emojis/896724352949706762.gif', url: 'https://discord.gg/xQF9f9yUEM' })
                .setDescription([
                    '',
                    '- Jednostavno ukucajte **naziv pesme** ili **YouTube link** da započnete žurku!',
                    '- U besplatnoj verziji podržavam samo **YouTube**.',
                    '',
                    '✨ *Spremni da napunite ovo mesto neverovatnom muzikom?*'
                ].join('\n'))
                .setColor(0x9966ff) 
                .addFields(
                    {
                        name: '🎯 Brzi Primjeri',
                        value: [
                            '• `shape of you`',
                            '• `lofi hip hop beats`',
                            '• `https://youtu.be/dQw4w9WgXcQ`',
                            '• `imagine dragons believer`'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🚀 Karakteristike',
                        value: [
                            '• 🎵 Visokokvalitetan audio',
                            '• 📜 Upravljanje redom', 
                            '• 🔁 Loop i shuffle modovi',
                            '• 🎛️ Kontrola jačine zvuka',
                            '• ⚡ Brzinska pretraga'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💡 Saveti',
                        value: [
                            '• Prvo se pridružite glasovnom kanalu',
                            '• Koristite specifične nazive pesama',
                            '• Probajte kombinaciju izvođač + pesma',
                            '• Playliste su podržane!'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setImage('https://i.ibb.co/DDSdKy31/ezgif-8aec7517f2146d.gif')
                .setFooter({ 
                    text: 'Ultimate Music Bot • Developed By GlaceYT!',
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();

            const message = await channel.send({ embeds: [embed] });
            
            await Server.findByIdAndUpdate(guildId, {
                'centralSetup.embedId': message.id,
                'centralSetup.channelId': channelId
            });

            console.log(`✅ Centralni embed kreiran u ${guildId}`);
            return message;
        } catch (error) {
            console.error('Greška pri kreiranju centralnog embeda:', error);
            return null;
        }
    }

    async resetAllCentralEmbedsOnStartup() {
        try {
            const servers = await Server.find({
                'centralSetup.enabled': true,
                'centralSetup.embedId': { $exists: true, $ne: null }
            });

            let resetCount = 0;
            let errorCount = 0;

            for (const serverConfig of servers) {
                try {
                    const guild = this.client.guilds.cache.get(serverConfig._id);
                    if (!guild) {
                        console.log(`⚠️ Bot više nije na serveru ${serverConfig._id}, čistim bazu podataka...`);
                        await Server.findByIdAndUpdate(serverConfig._id, {
                            'centralSetup.enabled': false,
                            'centralSetup.embedId': null
                        });
                        continue;
                    }

                    const channel = await this.client.channels.fetch(serverConfig.centralSetup.channelId).catch(() => null);
                    if (!channel) {
                        console.log(`⚠️ Centralni kanal nije pronađen na ${guild.name}, čistim...`);
                        await Server.findByIdAndUpdate(serverConfig._id, {
                            'centralSetup.enabled': false,
                            'centralSetup.embedId': null
                        });
                        continue;
                    }

                    const botMember = guild.members.me;
                    if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks'])) {
                        console.log(`⚠️ Nedostaju dozvole na ${guild.name}, preskačem...`);
                        continue;
                    }

                    const message = await channel.messages.fetch(serverConfig.centralSetup.embedId).catch(() => null);
                    if (!message) {
                        console.log(`⚠️ Centralni embed nije pronađen na ${guild.name}, kreiram novi...`);
                        const newMessage = await this.createCentralEmbed(channel.id, guild.id);
                        if (newMessage) {
                            resetCount++;
                        }
                        continue;
                    }

                    await this.updateCentralEmbed(serverConfig._id, null);
                    resetCount++;

                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    errorCount++;
                    if (error.code === 50001 || error.code === 10003 || error.code === 50013) {
                        await Server.findByIdAndUpdate(serverConfig._id, {
                            'centralSetup.enabled': false,
                            'centralSetup.embedId': null
                        });
                    }
                }
            }

        } catch (error) {
            console.error('❌ Greška pri automatskom resetovanju centralnih embedova:', error);
        }
    }

    async updateCentralEmbed(guildId, trackInfo = null) {
        try {
            const serverConfig = await Server.findById(guildId);
            if (!serverConfig?.centralSetup?.embedId) return;

            const channel = await this.client.channels.fetch(serverConfig.centralSetup.channelId);
            const message = await channel.messages.fetch(serverConfig.centralSetup.embedId);
            
            let embed, components = [];
            
            if (trackInfo) {
                const statusEmoji = trackInfo.paused ? '⏸️' : '▶️';
                const statusText = trackInfo.paused ? 'Pauzirano' : 'Sada se pušta';
                const loopEmoji = this.getLoopEmoji(trackInfo.loop);
                const embedColor = trackInfo.paused ? 0xFFA500 : 0x9966ff;
                
                const validThumbnail = this.validateThumbnail(trackInfo.thumbnail);
                
                embed = new EmbedBuilder()
                    .setAuthor({ 
                        name: `${trackInfo.title}`, 
                        iconURL: 'https://cdn.discordapp.com/emojis/896724352949706762.gif',
                        url: 'https://discord.gg/xQF9f9yUEM' 
                    })
                    .setDescription([
                        `**🎤 Izvođač:** ${trackInfo.author}`,
                        `**👤 Zahtevao:** <@${trackInfo.requester.id}>`,
                        '',
                        `⏰ **Trajanje:** \`${this.formatDuration(trackInfo.duration)}\``,
                        `${loopEmoji} **Ponavljanje:** \`${trackInfo.loop || 'Isključeno'}\``,
                        `🔊 **Jačina zvuka:** \`${trackInfo.volume || 50}%\``,
                        '',
                        '🎶 *Uživate u muzici? Kucajte još naziva pesama ispod da nastavite žurku!*'
                    ].join('\n'))
                    .setColor(embedColor)
                    .setFooter({ 
                        text: `Ultimate Music Bot • ${statusText} • Developed By GlaceYT`,
                        iconURL: this.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                // Only set thumbnail if we have a valid URL
                if (validThumbnail) {
                    embed.setThumbnail(validThumbnail);
                }

                if (!trackInfo.paused) {
                    embed.setImage('https://i.ibb.co/KzbPV8jd/aaa.gif');
                }
            
                components = this.createAdvancedControlButtons(trackInfo);
            } else {
                embed = new EmbedBuilder()
                .setAuthor({ name: 'Ultimate Muzički Kontrolni Centar', iconURL: 'https://cdn.discordapp.com/emojis/896724352949706762.gif', url: 'https://discord.gg/xQF9f9yUEM' })
                .setDescription([
                    '',
                    '- Jednostavno ukucajte **naziv pesme** ili **YouTube link** da započnete žurku!',
                    '- U besplatnoj verziji podržavam samo **YouTube**.',
                    '',
                    '✨ *Spremni da napunite ovo mesto neverovatnom muzikom?*'
                ].join('\n'))
                .setColor(0x9966ff) 
                .addFields(
                    {
                        name: '🎯 Brzi Primjeri',
                        value: [
                            '• `shape of you`',
                            '• `lofi hip hop beats`',
                            '• `https://youtu.be/dQw4w9WgXcQ`',
                            '• `imagine dragons believer`'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🚀 Karakteristike',
                        value: [
                            '• 🎵 Visokokvalitetan audio',
                            '• 📜 Upravljanje redom', 
                            '• 🔁 Loop i shuffle modovi',
                            '• 🎛️ Kontrola jačine zvuka',
                            '• ⚡ Brzinska pretraga'
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '💡 Saveti',
                        value: [
                            '• Prvo se pridružite glasovnom kanalu',
                            '• Koristite specifične nazive pesama',
                            '• Probajte kombinaciju izvođač + pesma',
                            '• Playliste su podržane!'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setImage('https://i.ibb.co/DDSdKy31/ezgif-8aec7517f2146d.gif')
                .setFooter({ 
                    text: 'Ultimate Music Bot • Developed By GlaceYT!',
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp();

                components = [];
            }

            await message.edit({ embeds: [embed], components });

        } catch (error) {
            console.error('Greška pri ažuriranju centralnog embeda:', error);
        }
    }

    createAdvancedControlButtons(trackInfo) {
        if (!trackInfo) return [];

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setEmoji('⏭️')
                    .setStyle(ButtonStyle.Primary),
                    
                new ButtonBuilder()
                    .setCustomId(trackInfo.paused ? 'music_resume' : 'music_pause')
                    .setEmoji(trackInfo.paused ? '▶️' : '⏸️')
                    .setStyle(ButtonStyle.Success),
                    
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setEmoji('🛑')
                    .setStyle(ButtonStyle.Danger),
                    
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setEmoji('📜')
                    .setStyle(ButtonStyle.Success),
                    
                new ButtonBuilder()
                    .setLabel('\u200B\u200BPonavljanje\u200B')
                    .setCustomId('music_loop')
                    .setEmoji(this.getLoopEmoji(trackInfo.loop))
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_volume_down')
                    .setEmoji('🔉')
                    .setStyle(ButtonStyle.Secondary),
                    
                new ButtonBuilder()
                    .setCustomId('music_volume_up')
                    .setEmoji('🔊')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('music_clear')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId('music_shuffle')
                    .setEmoji('🔀')
                    .setStyle(ButtonStyle.Secondary),
                    
                new ButtonBuilder()
                    .setLabel('Podrška')
                    .setStyle(ButtonStyle.Link)
                    .setURL(config.bot.supportServer)
            );

        return [row1, row2];
    }

    getLoopEmoji(loopMode) {
        switch (loopMode) {
            case 'track': return '🔂';
            case 'queue': return '🔁';
            default: return '⏺️';
        }
    }

    formatDuration(duration) {
        if (!duration) return '0:00';
        
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

module.exports = CentralEmbedHandler;
