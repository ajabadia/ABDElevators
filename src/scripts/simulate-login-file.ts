import { authorizeCredentials } from '../lib/auth-utils';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

async function runSim() {
    const credentials = {
        email: 'superadmin@abd.com',
        password: 'super123'
    };

    let resultMsg = "";
    try {
        const result = await authorizeCredentials(credentials);
        resultMsg = JSON.stringify(result, null, 2);
    } catch (e: any) {
        resultMsg = JSON.stringify({ error: e.message, stack: e.stack }, null, 2);
    }

    fs.writeFileSync(path.join(__dirname, 'sim-result.json'), resultMsg);
    process.exit(0);
}

runSim();
