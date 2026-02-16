import { connectDB } from './src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    try {
        const db = await connectDB();
        const count = await db.collection('usuarios').countDocuments();
        console.log(`Conexión exitosa. Total usuarios: ${count}`);

        const users = await db.collection('usuarios').find({}).toArray();
        users.forEach(u => {
            console.log(`- ${u.email} (Rol: ${u.rol})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
