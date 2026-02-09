
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectAuthDB } from '../src/lib/db';
import { User } from '../src/lib/schemas';

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address');
        process.exit(1);
    }

    console.log(`🔍 Debugging MFA for: ${email}`);
    console.log('ENV STATUS:', {
        hasUri: !!process.env.MONGODB_URI,
        uriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : 'N/A'
    });
    const db = await connectAuthDB();

    const user = await db.collection('users').findOne({ email });
    if (!user) {
        console.error('❌ User not found');
        process.exit(1);
    }

    console.log('👤 User found:', {
        _id: user._id,
        id_string: user._id.toString(),
        email: user.email,
        mfaEnabled: user.mfaEnabled,
        rol: user.rol,
        tenantId: user.tenantId
    });

    const mfaConfig = await db.collection('mfa_configs').findOne({ userId: user._id.toString() });
    console.log('🛡️ MFA Config (userId as string):', JSON.stringify(mfaConfig, null, 2));

    // Check if maybe stored as ObjectId?
    const mfaConfigObjId = await db.collection('mfa_configs').findOne({ userId: user._id });
    if (mfaConfigObjId) {
        console.warn('⚠️ Found MFA Config using ObjectId! This is likely the bug.');
        console.log('🛡️ MFA Config (userId as ObjectId):', JSON.stringify(mfaConfigObjId, null, 2));
    }

    // Check logic of isEnabled
    const isEnabled = await db.collection('mfa_configs').findOne({ userId: user._id.toString(), enabled: true });

    const output = {
        ENV_STATUS: {
            hasUri: !!process.env.MONGODB_URI,
            uriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : 'N/A'
        },
        user: {
            _id: user._id,
            id_string: user._id.toString(),
            email: user.email,
            mfaEnabled: user.mfaEnabled,
            rol: user.rol,
            tenantId: user.tenantId
        },
        mfaConfig: mfaConfig,
        mfaConfigObjId: mfaConfigObjId,
        isEnabledCheck: !!isEnabled
    };

    const fs = require('fs');
    fs.writeFileSync('debug_mfa_out.json', JSON.stringify(output, null, 2));
    console.log('✅ Output written to debug_mfa_out.json');

    process.exit(0);
}

main().catch(console.error);
