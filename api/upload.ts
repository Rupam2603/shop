import { put } from '@vercel/blob';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '8mb',
        },
    },
};

function base64ToBuffer(base64Data: string): { buffer: Buffer; extension: string; contentType: string } {
    const match = base64Data.match(/^data:(.*?);base64,(.*)$/);
    if (!match) throw new Error('Invalid base64 image data');
    const contentType = match[1];
    const extension = contentType.split('/')[1] || 'png';
    const buffer = Buffer.from(match[2], 'base64');
    return { buffer, extension, contentType };
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, folder } = req.body;
        if (!image || typeof image !== 'string') {
            return res.status(400).json({ error: 'Missing image data' });
        }

        const { buffer, extension, contentType } = base64ToBuffer(image);
        const fileName = `${folder || 'uploads'}/image_${Date.now()}.${extension}`;

        const blob = await put(fileName, buffer, {
            access: 'public',
            contentType,
            token: process.env.BLOB_READ_WRITE_TOKEN, // server-side only, never exposed to browser
        });

        return res.status(200).json({ url: blob.url });
    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error?.message || 'Upload failed' });
    }
}
