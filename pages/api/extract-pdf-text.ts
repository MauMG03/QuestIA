import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import pdf from 'pdf-parse';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL del PDF requerida.' });
    }
    try {
        // Descargar el PDF
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const data = response.data;
        // Extraer texto
        const pdfData = await pdf(data);
        res.status(200).json({ text: pdfData.text });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo extraer el texto del PDF.' });
    }
}
