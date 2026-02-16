import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function checkUser() {
    if (!uri) {
        process.exit(1);
    }
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const user = await db.collection('usuarios').findOne({ email: 'admin@abd.com' });
        if (!user) {
            console.log('❌ User admin@abd.com NOT FOUND in DB');
        } else {
            console.log('✅ User Found. Role:', user.rol);
            const matches = await bcrypt.compare('admin123', user.password);
            console.log('🔑 Password "admin123" matches hash in DB:', matches);
        }
    } finally {
        await client.close();
    }
}
checkUser();
