import { auth } from '../src/lib/auth';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testAuthorize() {
    console.log('--- Testing Authorize Logic ---');

    // We can't easily call the internal 'authorize' from the outside because NextAuth wraps it.
    // But we can try to find where it's defined and test the logic.
    // Instead, let's just re-implement the exact same logic in this script to see if it works with the current env.

    const { connectDB } = await import('../src/lib/db');
    const bcrypt = await import('bcryptjs');
    const { z } = await import('zod');

    const LoginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
    });

    const credentials = {
        email: 'admin@abd.com',
        password: 'admin123'
    };

    try {
        console.log('1. Validating with Zod...');
        const parsed = LoginSchema.parse(credentials);
        console.log('✅ Zod Validation OK');

        console.log('2. Connecting to DB...');
        const db = await connectDB();
        console.log('✅ DB Connected');

        console.log('3. Searching user:', parsed.email);
        const user = await db.collection("usuarios").findOne({ email: parsed.email });

        if (!user) {
            console.log('❌ User NOT found in collection "usuarios"');
            return;
        }
        console.log('✅ User Found. ID:', user._id);

        console.log('4. Comparing password...');
        const isValid = await bcrypt.compare(parsed.password, user.password);
        if (isValid) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password DOES NOT match');
        }

    } catch (err: any) {
        console.error('💥 Error in flow:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

testAuthorize();
