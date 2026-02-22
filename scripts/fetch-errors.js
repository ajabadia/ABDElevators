const { MongoClient } = require('mongodb');

async function run() {
    const uri = process.env.MONGODB_LOGS_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators-Logs');

        console.log("--- FINDING ROOT CAUSE ERRORS ---");
        const logs = await db.collection('application_logs').find({
            level: 'ERROR',
            message: { $not: /circuit breaker is open/i }
        }).sort({ timestamp: -1 }).limit(5).toArray();

        logs.forEach(l => {
            console.log(`\nTIMESTAMP: ${l.timestamp}`);
            console.log(`ACTION: ${l.action}`);
            console.log(`MESSAGE: ${l.message}`);
            console.log(`DETAILS: ${JSON.stringify(l.details, null, 2)}`);
        });
    } finally {
        await client.close();
    }
}

run();
