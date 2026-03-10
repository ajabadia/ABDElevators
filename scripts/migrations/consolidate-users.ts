import path from 'node:path';
import { connectAuthDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function consolidateUsers() {
    try {
        console.log('--- CONSOLIDATING USERS (AUTH DB) ---');
        const authDb = await connectAuthDB();

        const usersCol = authDb.collection('users');
        const v2UsersCol = authDb.collection('v2_users');

        const v2Users = await v2UsersCol.find({}).toArray();
        console.log(`Found ${v2Users.length} users in v2_users.`);

        for (const v2User of v2Users) {
            console.log(`Processing user: ${v2User.email}...`);

            // Sync preferences to the primary users collection
            if (v2User.preferences) {
                const result = await usersCol.updateOne(
                    { email: v2User.email },
                    { $set: { preferences: v2User.preferences } }
                );

                if (result.matchedCount > 0) {
                    console.log(`✅ Preferences updated for ${v2User.email}.`);
                } else {
                    console.warn(`⚠️ User ${v2User.email} not found in primary [users] collection.`);
                }
            }
        }

        await authDb.client.close();
        console.log('--- Consolidation Finished ---');
    } catch (error: any) {
        console.error('❌ Consolidation failed:', error.message);
    }
}

consolidateUsers();
