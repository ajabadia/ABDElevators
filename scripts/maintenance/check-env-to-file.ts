
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const varsToCheck = [
    'MONGODB_URI',
    'DATABASE_URL',
    'MONGODB_AUTH_URI',
    'MONGODB_CONFIG_URI',
    'MONGODB_LOGS_URI',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'REDIS_URL'
];

let output = '--- Environment Check ---\n';
varsToCheck.forEach(v => {
    const val = process.env[v];
    if (val) {
        const isLocal = val.includes('localhost') || val.includes('127.0.0.1');
        const masked = val.length > 20 ? `${val.substring(0, 5)}...${val.substring(val.length - 5)}` : val;
        output += `${v}=${masked} (Local: ${isLocal})\n`;
    } else {
        output += `${v}=NOT SET\n`;
    }
});

fs.writeFileSync(path.resolve(process.cwd(), 'env_results.txt'), output);
console.log('Results written to env_results.txt');
