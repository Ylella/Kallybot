import fetch from 'node-fetch';

const APP_ID = 'TU_APP_ID';
const GUILD_ID = 'TU_GUILD_ID';
const BOT_TOKEN = 'TU_BOT_TOKEN';

const command = {
  name: 'buscar',
  description: 'Busca un nombre en la hoja',
  options: [
    {
      name: 'nombre',
      description: 'Nombre a buscar',
      type: 3, // STRING
      required: true
    }
  ]
};

const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(command)
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);