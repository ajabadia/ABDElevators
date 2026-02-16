
import { connectDB } from '../src/lib/db';

async function checkEvals() {
    const db = await connectDB();
    const evals = await db.collection('rag_evaluations').find({}).limit(3).toArray();
    console.log(JSON.stringify(evals, null, 2));
    process.exit(0);
}

checkEvals();
