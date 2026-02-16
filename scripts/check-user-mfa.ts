import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkUserMfa() {
    try {
        const { connectAuthDB } = await import('./src/lib/db');
        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: 'admin@elevadores.mx' });

        if (user) {
            console.log(`User: ${user.email}`);
            console.log(`mfaEnabled: ${user.mfaEnabled}`);
            console.log(`FullName: ${user.nombre} ${user.apellidos}`);

            const mfaConfig = await db.collection('mfa_configs').findOne({ userId: user._id.toString() });
            console.log(`mfa_configs found: ${!!mfaConfig}`);
            if (mfaConfig) {
                console.log(`mfa_configs.enabled: ${mfaConfig.enabled}`);
            }
        } else {
            console.log('User admin@elevadores.mx not found');
        }
    } catch (error) {
        console.error('Error during execution:', error);
    }
    process.exit(0);
}

checkUserMfa();
