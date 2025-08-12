import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Verificar firma de Discord
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const rawBody = JSON.stringify(req.body);

  const isValid = verifyKey(
    Buffer.from(rawBody),
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY
  );

  if (!isValid) {
    return res.status(401).send('Bad request signature');
  }

  const interaction = req.body;

  // Ping de Discord para validar endpoint
  if (interaction.type === InteractionType.PING) {
    return res.status(200).json({ type: InteractionResponseType.PONG });
  }

  // Comando /buscar
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = interaction.data;

    if (name === 'buscar') {
      const query = options[0].value.toLowerCase();

      // Llamar a Google Sheets
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
