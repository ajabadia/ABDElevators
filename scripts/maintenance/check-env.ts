
import * as dotenv from 'dotenv';
import * as path from 'path';

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

console.log('--- Environment Check ---');
varsToCheck.forEach(v => {
    const val = process.env[v];
    if (val) {
        // Mask sensitive part but show the start/end or if it has 'localhost'
        const isLocal = val.includes('localhost') || val.includes('127.0.0.1');
        const masked = val.length > 20 ? `${val.substring(0, 5)}...${val.substring(val.length - 5)}` : val;
        console.log(`${v}=${masked} (Local: ${isLocal})`);
    } else {
        console.log(`${v}=NOT SET`);
    }
});
