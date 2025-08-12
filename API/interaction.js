import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import getRawBody from 'raw-body';
import { TextDecoder } from 'util';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,  // IMPORTANTE: desactiva el bodyParser automático
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Obtiene el body crudo como Buffer
  const rawBodyBuffer = await getRawBody(req);
  const rawBody = new TextDecoder().decode(rawBodyBuffer);

  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];

  const isValid = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);

  if (!isValid) {
    return res.status(401).send('Bad request signature');
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return res.status(200).json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = interaction.data;

    if (name === 'card') {
      const query = options[0].value.toLowerCase();

      // Llamada a Google Sheets
      const sheetURL = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/A:D?key=${process.env.GOOGLE_API_KEY}`;
      const response = await fetch(sheetURL);
      const data = await response.json();

      if (!data.values) {
        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'No se pudo acceder a la hoja.' }
        });
      }

      const match = data.values.find(row => row[0]?.toLowerCase().startsWith(query));

      if (!match) {
        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'No encontré nada con ese nombre.' }
        });
      }

      const [nombre, dato1, dato2, img] = match;

      return res.status(200).json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `**${nombre}**\nDato1: ${dato1}\nDato2: ${dato2}\n${img}`
        }
      });
    }
  }

  res.status(400).send('Unhandled interaction type');
}

