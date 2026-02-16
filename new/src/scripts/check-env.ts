import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('--- ENV CHECK ---');
console.log('CWD:', process.cwd());
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'FOUND (masked)' : 'NOT FOUND');
console.log('SINGLE_TENANT_ID:', process.env.SINGLE_TENANT_ID);
console.log('-----------------');
