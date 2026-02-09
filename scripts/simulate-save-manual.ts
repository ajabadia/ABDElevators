
import { connectAuthDB } from '../src/lib/db';
import { z } from 'zod';
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

// Minimal Schema to reproduce validation logic
const TenantConfigSchema = z.object({
    tenantId: z.string().optional(),
    name: z.string().optional(),
    branding: z.object({
        colors: z.object({
            primary: z.string().optional(),
            accent: z.string().optional()
        }).optional(),
        companyName: z.string().optional()
    }).optional()
});

async function simulateSaveManual() {
    try {
        console.log('--- SIMULATING SAVE MANUAL (No Service) ---');

        const tenantId = 'elevadores_mx';
        const newData = {
            name: "Elevadores MX (Agent Verified)",
            branding: {
                colors: {
                    primary: "#123456",
                    accent: "#654321"
                },
                companyName: "Elevadores MX Verified"
            }
        };

        // 1. Validation
        const validated = TenantConfigSchema.parse(newData);
        console.log('Validation passed:', validated);

        // 2. DB Update
        const db = await connectAuthDB();
        const result = await db.collection('tenants').updateOne(
            { tenantId },
            {
                $set: {
                    ...validated,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log('Update Result:', {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedId: result.upsertedId
        });

        // 3. Read Verification
        const verify = await db.collection('tenants').findOne({ tenantId });
        console.log('Read back name:', verify?.name);
        console.log('Read back primary:', verify?.branding?.colors?.primary);

    } catch (e: any) {
        console.error('Error:', e);
    }
}

simulateSaveManual();
