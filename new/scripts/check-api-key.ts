import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkApiKey() {
    const rawKey = process.env.GEMINI_API_KEY;
    console.log('API KEY RAW:', rawKey);
    console.log('API KEY TYPE:', typeof rawKey);
    console.log('API KEY LENGTH:', rawKey?.length);

    if (rawKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${rawKey.replace(/"/g, '')}`;
        console.log('Testing URL (sanitized):', url.replace(rawKey.replace(/"/g, ''), 'HIDDEN'));

        try {
            const res = await fetch(url);
            const data: any = await res.json();
            if (data.models) {
                const models = data.models.map((m: any) => m.name).join('\n');
                require('fs').writeFileSync('models_available.txt', models);
                console.log('✅ Models saved to models_available.txt');
            } else {
                console.log('❌ NO MODELS FOUND. DATA:', JSON.stringify(data));
            }
        } catch (e: any) {
            console.error('❌ FETCH ERROR:', e.message);
        }
    }
}

checkApiKey();
