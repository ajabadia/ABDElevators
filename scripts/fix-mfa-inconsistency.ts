
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectAuthDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: npx tsx scripts/fix-mfa-inconsistency.ts <email>');
        process.exit(1);
    }

    console.log(`🔧 Fixing MFA consistency for: ${email}`);
    const db = await connectAuthDB();

    const user = await db.collection('users').findOne({ email });
    if (!user) {
        console.error('❌ User not found');
        process.exit(1);
    }

    const mfaConfig = await db.collection('mfa_configs').findOne({ userId: user._id.toString(), enabled: true });
    if (!mfaConfig) {
        console.error('❌ No active MFA config found. Cannot enable MFA on user.');
        process.exit(1);
    }

    console.log('✅ Active MFA config found:', mfaConfig._id);

    const result = await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { mfaEnabled: true } }
    );

    console.log('✅ Update Info:', result);

    const verify = await db.collection('users').findOne({ email });
    console.log('🔍 Verification (mfaEnabled):', verify?.mfaEnabled);

    process.exit(0);
}

main().catch(console.error);
