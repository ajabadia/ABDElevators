import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fix() {
    const AUTH_URI = process.env.MONGODB_AUTH_URI;
    if (!AUTH_URI) {
        console.error('❌ MONGODB_AUTH_URI not found');
        return;
    }
    const client = new MongoClient(AUTH_URI);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Auth');
        const users = db.collection('users');

        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`🔧 Fixing user admin@abd.com...`);
        console.log(`🔑 New Hash: ${hashedPassword}`);

        const res = await users.updateOne(
            { email: 'admin@abd.com' },
            {
                $set: {
                    password: hashedPassword,
                    mfaEnabled: false,
                    rol: 'ADMIN',
                    activo: true,
                    nombre: 'Admin',
                    tenantId: 'default_tenant'
                }
            },
            { upsert: true }
        );

        console.log(`✅ Update Result:`, res);

        const updatedUser = await users.findOne({ email: 'admin@abd.com' });
        console.log(`👤 User in DB:`, {
            email: updatedUser?.email,
            mfaEnabled: updatedUser?.mfaEnabled,
            hasPassword: !!updatedUser?.password
        });

        // Test comparison locally immediately
        const match = await bcrypt.compare(password, updatedUser!.password);
        console.log(`🧪 Local Test Match: ${match ? '✅ MATCH' : '❌ NO MATCH'}`);

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

fix();
