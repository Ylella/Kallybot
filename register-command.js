import fetch from 'node-fetch';

const APP_ID = process.env.APP_ID;
const GUILD_ID = process.env.GUILD_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

const COMMAND = {
  name: 'card',
  description: 'Search for a card in Google Sheets',
  type: 1,
  options: [
    {
      name: 'cardName',
      description: 'Card to search for',
      type: 3,
      required: true
    }
  ]
};

async function registerCommand() {
  const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(COMMAND)
  });

  const data = await response.json();
  console.log('Comando registrado:', data);
}

registerCommand().catch(console.error);

