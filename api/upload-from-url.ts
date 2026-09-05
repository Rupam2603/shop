import { put } from '@vercel/blob';

// The handler takes a URL, fetches the file, and puts it in Blob
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, folder } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Missing image url' });
        }

        // Basic SSRF protection (prevent local IPs)
        try {
            const parsedUrl = new URL(url);
            if (
                parsedUrl.hostname === 'localhost' ||
                parsedUrl.hostname === '127.0.0.1' ||
                parsedUrl.hostname.startsWith('192.168.') ||
                parsedUrl.hostname.startsWith('10.') ||
                parsedUrl.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
            ) {
                return res.status(400).json({ error: 'Invalid URL hostname' });
            }
        } catch (e) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(400).json({ error: `Failed to fetch image: ${response.status} ${response.statusText}` });
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            return res.status(400).json({ error: 'URL does not point to a valid image (invalid content-type)' });
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) { // 5MB limit
            return res.status(400).json({ error: 'Image is too large (max 5MB)' });
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image is too large (max 5MB)' });
        }

        const buffer = Buffer.from(arrayBuffer);
        const extension = contentType.split('/')[1] || 'png';
        const fileName = `${folder || 'uploads'}/image_imported_${Date.now()}.${extension}`;

        const blob = await put(fileName, buffer, {
            access: 'public',
            contentType,
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        return res.status(200).json({ url: blob.url });
    } catch (error: any) {
        console.error('Upload from URL error:', error);
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Image fetch timeout' });
        }
        return res.status(500).json({ error: error?.message || 'Upload from URL failed' });
    }
}
