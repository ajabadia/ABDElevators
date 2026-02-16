import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Manual env loader since dotenv might be tricky in pure CLI
function loadEnv() {
    const envPaths = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), '.env.development.local')
    ];

    envPaths.forEach(envPath => {
        if (!fs.existsSync(envPath)) return;
        console.log(`📖 Loading env from ${envPath}`);
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...val] = trimmed.split('=');
            if (key && val) {
                process.env[key.trim()] = val.join('=').trim().replace(/^['"](.*)['"]$/, '$1');
            }
        });
    });
}

async function run() {
    loadEnv();
    const uri = process.env.MONGODB_LOGS_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error("Missing MONGODB_URI");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbName = process.env.MONGODB_LOGS_URI ? 'ABDElevators-Logs' : 'ABDElevators';
        const db = client.db(dbName);
        const logs = await db.collection('application_logs')
            .find({}) // Broad search
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        // Write to file for Antigravity to read
        fs.writeFileSync(path.join(process.cwd(), 'src/scripts/log-extract.json'), JSON.stringify(logs, null, 2));
        console.log(`✅ Extracted ${logs.length} logs to src/scripts/log-extract.json`);
    } catch (e: any) {
        console.error("💥 Error:", e.message);
    } finally {
        await client.close();
    }
}

run();
