// Require the necessary discord.js classes
import fs from 'node:fs';
import { Client, Collection, Intents } from 'discord.js';

import config from './secretConfig.json' assert { type: 'json' };
const token = config.bot.token;

// Create a new client instance
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS
] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);

    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.default.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = await import(`./events/${file}`);

    if (event.once) {
        client.once(event.default.name, event.default.execute);
    } else {
        client.on(event.default.name, event.default.execute);
        //client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token);
