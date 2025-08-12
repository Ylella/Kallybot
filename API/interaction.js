import { verifyKey } from 'discord-interactions';
import fetch from 'node-fetch';

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 1. Verificar firma de Discord
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const body = JSON.stringify(req.body);

    const isValid = verifyKey(body, signature, timestamp, PUBLIC_KEY);
    if (!isValid) {
      return res.status(401).send('Bad request signature');
    }

    // 2. Ping de Discord (tipo 1)
    if (req.body.type === 1) {
      return res.json({ type: 1 });
    }

    // 3. Comando slash
    if (req.body.type === 2) {
      const nombreBuscado = req.body.data.options[0].value.toLowerCase();

      // Leer Google Sheets
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:D?key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      const filas = data.values || [];
      let encontrado = null;

      for (let i = 1; i < filas.length; i++) { // i=1 para saltar cabecera
        const nombre = (filas[i][0] || "").toLowerCase();
        if (nombre.startsWith(nombreBuscado)) {
          encontrado = filas[i];
          break;
        }
      }

      if (!encontrado) {
        return res.json({
          type: 4,
          data: { content: `No encontré ningún resultado para: ${nombreBuscado}` }
        });
      }

      const texto = encontrado[1] || "Sin texto";
      const datoExtra = encontrado[2] || "";
      const imagenUrl = encontrado[3] || "";

      // Responder con embed
      return res.json({
        type: 4,
        data: {
          embeds: [
            {
              title: encontrado[0],
              description: `${texto}\n${datoExtra}`,
              thumbnail: { url: imagenUrl },
              color: 0x00AE86
            }
          ]
        }
      });
    }
  }

  res.status(404).send('Not found');
}