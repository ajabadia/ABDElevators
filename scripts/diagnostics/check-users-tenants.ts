
import { connectAuthDB } from '../src/lib/db';
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

process.env.MONGODB_AUTH_URI = getEnv('MONGODB_AUTH_URI');
process.env.MONGODB_URI = getEnv('MONGODB_URI');

async function checkUsers() {
    try {
        const db = await connectAuthDB();
        const users = await db.collection('users').find({}).toArray();

        console.log(`Checking ${users.length} users...`);
        for (const user of users) {
            console.log(`User: ${user.email} | Role: ${user.role} | TenantID: ${user.tenantId}`);
        }
    } catch (e: any) {
        console.error(e);
    }
}

checkUsers();
