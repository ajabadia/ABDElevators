
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^"(.*)"$/, '$1') : undefined;
};

const uri = getEnv('MONGODB_AUTH_URI') || getEnv('MONGODB_URI');

async function forceBranding() {
    if (!uri) {
        console.error('Missing MONGODB_URI');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const tenantIds = ['abd_global', 'default_tenant'];

        for (const tenantId of tenantIds) {
            console.log(`Setting brown branding for ${tenantId}...`);
            await db.collection('tenants').updateOne(
                { tenantId },
                {
                    $set: {
                        branding: {
                            colors: {
                                primary: '#964B00', // Brown
                                accent: '#964B00'
                            },
                            autoDarkMode: true
                        },
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
        }

        console.log('Update result:', result.modifiedCount, 'documents modified');

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await client.close();
    }
}

forceBranding();
