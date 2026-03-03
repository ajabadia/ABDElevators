
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { PROMPTS } from '../src/lib/prompts';
console.log("✅ Prompts loaded. Keys:", Object.keys(PROMPTS).length);

try {
    const schemas = require('../src/lib/schemas');
    console.log("✅ Schemas loaded.");
} catch (e) {
    console.error("❌ Schemas failed:", e);
}

try {
    const dbModule = require('../src/lib/db');
    console.log("✅ DB module loaded.");
} catch (e) {
    console.error("❌ DB module failed:", e);
}

try {
    const mongodb = require('mongodb');
    console.log("✅ MongoDB loaded.");
} catch (e) {
    console.error("❌ MongoDB failed:", e);
}

console.log("Checking PROMPTS keys...");
if (!PROMPTS.WORKFLOW_ROUTER) console.error("❌ WORKFLOW_ROUTER is missing!");
else console.log("✅ WORKFLOW_ROUTER exists.");
