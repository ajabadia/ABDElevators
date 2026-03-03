
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectAuthDB } from '../src/lib/db';
import { UserRole } from '../src/types/roles';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address');
        process.exit(1);
    }

    console.log(`🚀 Promoting user ${email} to SUPER_ADMIN...`);
    const db = await connectAuthDB();

    const result = await db.collection('users').updateOne(
        { email },
        {
            $set: {
                role: UserRole.SUPER_ADMIN,
                // Ensure legacy field if it exists is also updated
                rol: UserRole.SUPER_ADMIN,
                updatedAt: new Date()
            }
        }
    );

    if (result.matchedCount === 0) {
        console.error('❌ User not found');
        process.exit(1);
    }

    if (result.modifiedCount === 0) {
        console.log('ℹ️ User already has SUPER_ADMIN role');
    } else {
        console.log('✅ User promoted successfully');
    }

    process.exit(0);
}

main().catch(console.error);
