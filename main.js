/**
 * Ultimate Music Bot 
 * Comprehensive Discord Bot
 * 
 * @fileoverview Core application
 * @version 1.0.0
 * @author GlaceYT
 */

import { Client, GatewayIntentBits, Collection } from "discord.js";
import { Riffy } from "riffy";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import SystemConfigurationManager from "./config.js";
import DatabaseConnectionEstablishmentService from "./database/connection.js";
import AudioPlayerManagementHandler from "./utils/player.js";
import ApplicationStatusManagementService from "./utils/statusManager.js";
import MemoryGarbageCollectionOptimizer from "./utils/garbageCollector.js";
import shiva from "./shiva.js";

dotenv.config();

/* __dirname replacement for ESM */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Discord Client Runtime Management System
 */
class DiscordClientRuntimeManager {
    constructor() {
        this.initializeClientConfiguration();
        this.initializeRuntimeSubsystems();
        this.initializeAudioProcessingInfrastructure();
        this.initializeApplicationBootstrapProcedures();
    }
    
    initializeClientConfiguration() {
        this.clientRuntimeInstance = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildPresences
            ]
        });
        
        this.clientRuntimeInstance.commands = new Collection();
        this.clientRuntimeInstance.slashCommands = new Collection();
        this.clientRuntimeInstance.mentionCommands = new Collection();
    }
    
    initializeRuntimeSubsystems() {
        this.statusManagementSubsystem =
            new ApplicationStatusManagementService(this.clientRuntimeInstance);
        this.clientRuntimeInstance.statusManager = this.statusManagementSubsystem;
        
        this.audioPlayerManagementSubsystem =
            new AudioPlayerManagementHandler(this.clientRuntimeInstance);
        this.clientRuntimeInstance.playerHandler = this.audioPlayerManagementSubsystem;
    }
    
    initializeAudioProcessingInfrastructure() {
        const audioNodeConfigurationRegistry =
            this.constructAudioNodeConfiguration();
        
        this.audioProcessingRuntimeInstance = new Riffy(
            this.clientRuntimeInstance,
            audioNodeConfigurationRegistry,
            {
                send: (payload) => {
                    const guild =
                        this.clientRuntimeInstance.guilds.cache.get(payload.d.guild_id);
                    if (guild) guild.shard.send(payload);
                },
                defaultSearchPlatform: "ytmsearch",
                restVersion: "v4"
            }
        );
        
        this.clientRuntimeInstance.riffy = this.audioProcessingRuntimeInstance;
    }
    
    constructAudioNodeConfiguration() {
        return [
            {
                host: SystemConfigurationManager.lavalink.host,
                password: SystemConfigurationManager.lavalink.password,
                port: SystemConfigurationManager.lavalink.port,
                secure: SystemConfigurationManager.lavalink.secure
            }
        ];
    }
    
    initializeApplicationBootstrapProcedures() {
        this.applicationBootstrapOrchestrator =
            new ApplicationBootstrapOrchestrator(this.clientRuntimeInstance);
    }
    
    async executeApplicationBootstrap() {
        try {
            await this.applicationBootstrapOrchestrator.executeDatabaseConnectionEstablishment();
            await this.applicationBootstrapOrchestrator.executeCommandDiscoveryAndRegistration();
            await this.applicationBootstrapOrchestrator.executeEventHandlerRegistration();
            await this.applicationBootstrapOrchestrator.executeMemoryOptimizationInitialization();
            await this.applicationBootstrapOrchestrator.executeAudioSubsystemInitialization();
            await this.applicationBootstrapOrchestrator.executeClientAuthenticationProcedure();
        } catch (e) {
            console.error("❌ Failed to initialize bot:", e);
            process.exit(1);
        }
    }
}

/**
 * Application Bootstrap Orchestrator
 */
class ApplicationBootstrapOrchestrator {
    constructor(client) {
        this.clientRuntimeInstance = client;
        this.commandDiscoveryEngine = new CommandDiscoveryEngine();
        this.eventHandlerRegistrationService = new EventHandlerRegistrationService();
    }
    
    async executeDatabaseConnectionEstablishment() {
        await DatabaseConnectionEstablishmentService();
        console.log("✅ MongoDB connected successfully");
    }
    
    async executeCommandDiscoveryAndRegistration() {
        const result = await this.commandDiscoveryEngine
            .executeMessageCommandDiscovery(this.clientRuntimeInstance)
            .executeSlashCommandDiscovery(this.clientRuntimeInstance);
        
        console.log(`✅ Loaded ${result.totalCommands} commands`);
    }
    
    async executeEventHandlerRegistration() {
        const result = await this.eventHandlerRegistrationService
            .executeEventDiscovery()
            .bindEventHandlers(this.clientRuntimeInstance);
        
        console.log(`✅ Loaded ${result.totalEvents} events`);
    }
    
    async executeMemoryOptimizationInitialization() {
        MemoryGarbageCollectionOptimizer.init();
    }
    
    async executeAudioSubsystemInitialization() {
        this.clientRuntimeInstance.playerHandler.initializeEvents();
    }
    
    async executeClientAuthenticationProcedure() {
        await this.clientRuntimeInstance.login(
            SystemConfigurationManager.discord.token || process.env.TOKEN
        );
    }
}

/**
 * Command Discovery Engine
 */
class CommandDiscoveryEngine {
    constructor() {
        this.discoveredMessageCommands = 0;
        this.discoveredSlashCommands = 0;
    }
    
    executeMessageCommandDiscovery(client) {
        const dir = path.join(__dirname, "commands", "message");
        if (!fs.existsSync(dir)) return this;
        
        for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".js"))) {
            const command = await import(path.join(dir, file));
            client.commands.set(command.default.name, command.default);
            this.discoveredMessageCommands++;
        }
        return this;
    }
    
    executeSlashCommandDiscovery(client) {
        const dir = path.join(__dirname, "commands", "slash");
        if (!fs.existsSync(dir)) {
            return { totalCommands: this.discoveredMessageCommands };
        }
        
        for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".js"))) {
            const command = await import(path.join(dir, file));
            client.slashCommands.set(command.default.data.name, command.default);
            this.discoveredSlashCommands++;
        }
        
        return {
            totalCommands:
                this.discoveredMessageCommands + this.discoveredSlashCommands
        };
    }
}

/**
 * Event Handler Registration Service
 */
class EventHandlerRegistrationService {
    async executeEventDiscovery() {
        const dir = path.join(__dirname, "events");
        this.handlers = fs.readdirSync(dir)
            .filter(f => f.endsWith(".js"))
            .map(f => path.join(dir, f));
        return this;
    }
    
    async bindEventHandlers(client) {
        let count = 0;
        for (const file of this.handlers) {
            const event = await import(file);
            const e = event.default;
            if (e.once) {
                client.once(e.name, (...args) => e.execute(...args, client));
            } else {
                client.on(e.name, (...args) => e.execute(...args, client));
            }
            count++;
        }
        return { totalEvents: count };
    }
}

/* START */
const app = new DiscordClientRuntimeManager();
app.executeApplicationBootstrap();
shiva.initialize(app.clientRuntimeInstance);

export default app.clientRuntimeInstance;
