
import { connectAuthDB, connectLogsDB } from '../src/lib/db';
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

async function diagnoseElevadores() {
    try {
        const authDB = await connectAuthDB();
        const logsDB = await connectLogsDB();

        console.log('\n--- 1. USER CHECK ---');
        const user = await authDB.collection('users').findOne({ email: 'admin@elevadores.mx' });
        console.log('User:', user ? {
            email: user.email,
            tenantId: user.tenantId,
            role: user.role
        } : 'NOT FOUND');

        if (user?.tenantId) {
            console.log('\n--- 2. TENANT CHECK ---');
            const tenant = await authDB.collection('tenants').findOne({ tenantId: user.tenantId });
            console.log('Tenant in DB:', tenant ? {
                tenantId: tenant.tenantId,
                name: tenant.name,
                brandingColors: tenant.branding?.colors,
                updatedAt: tenant.updatedAt
            } : 'NOT FOUND');

            console.log('\n--- 3. RECENT LOGS CHECK (Last 5 mins) ---');
            const logs = await logsDB.collection('application_logs')
                .find({
                    $or: [
                        { 'details.tenantId': user.tenantId },
                        { message: { $regex: user.tenantId } }
                    ]
                })
                .sort({ timestamp: -1 })
                .limit(10)
                .toArray();

            console.log(`Found ${logs.length} logs:`);
            logs.forEach(l => {
                console.log(`[${l.timestamp.toISOString()}] ${l.level} ${l.action}: ${l.message}`);
                if (l.details) console.log('   Details:', JSON.stringify(l.details));
            });
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

diagnoseElevadores();
