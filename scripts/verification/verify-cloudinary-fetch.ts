
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testFetch() {
    // Exact ID from the database
    const publicId = 'abd-rag-platform/tenants/abd_global/documentos-rag/1770728547712_Real Decreto 203-2016 - BOE-A-2016-4953-consolidado.pdf';

    console.log(`Generating signed URL for: "${publicId}"`);

    try {
        const signedUrl = cloudinary.url(publicId, {
            resource_type: 'raw',
            sign_url: true,
            secure: true
        });

        console.log(`Signed URL: ${signedUrl}`);

        const response = await fetch(signedUrl);
        console.log(`Status: ${response.status}`);
        console.log(`Status Text: ${response.statusText}`);
        console.log(`OK: ${response.ok}`);

        if (response.ok) {
            const buffer = await response.arrayBuffer();
            console.log(`Success! Received ${buffer.byteLength} bytes.`);
        } else {
            const text = await response.text();
            console.log('Error Body Snippet:', text.substring(0, 500));
        }
    } catch (error: any) {
        console.error('FETCH EXCEPTION:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

testFetch();
