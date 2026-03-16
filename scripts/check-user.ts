
import { connectDB } from '../src/lib/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkUser() {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ email: 'superadmin@abd.com' });
    console.log('User found:', JSON.stringify(user, null, 2));
    process.exit(0);
}

checkUser().catch(err => {
    console.error(err);
    process.exit(1);
});
