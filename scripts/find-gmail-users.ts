import { connectAuthDB } from './src/lib/db.ts';

async function listGmailUsers() {
    try {
        const db = await connectAuthDB();
        const users = await db.collection('users').find({ email: { $regex: /@gmail\.com$/i } }).toArray();
        console.log('--- GMAIL USERS FOUND ---');
        users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listGmailUsers();
