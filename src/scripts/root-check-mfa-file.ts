import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function checkUserMfa() {
    let output = '';
    try {
        const { connectAuthDB } = await import('./src/lib/db');
        const db = await connectAuthDB();
        const user = await db.collection('users').findOne({ email: 'admin@elevadores.mx' });

        if (user) {
            output += `User: ${user.email}\n`;
            output += `mfaEnabled: ${user.mfaEnabled}\n`;
            output += `FullName: ${user.nombre} ${user.apellidos}\n`;

            const mfaConfig = await db.collection('mfa_configs').findOne({ userId: user._id.toString() });
            output += `mfa_configs found: ${!!mfaConfig}\n`;
            if (mfaConfig) {
                output += `mfa_configs.enabled: ${mfaConfig.enabled}\n`;
            }
        } else {
            output += 'User admin@elevadores.mx not found\n';
        }
    } catch (error: any) {
        output += `Error during execution: ${error.message}\n`;
    }
    fs.writeFileSync('mfa-check-output.txt', output);
    process.exit(0);
}

checkUserMfa();
