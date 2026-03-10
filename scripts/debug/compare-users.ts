import path from 'node:path';
import { connectAuthDB } from '../../packages/platform-core/src/server/db';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function compareUsers() {
    try {
        const authDb = await connectAuthDB();

        const usersCol = authDb.collection('users');
        const v2UsersCol = authDb.collection('v2_users');

        const usersCount = await usersCol.countDocuments();
        const v2UsersCount = await v2UsersCol.countDocuments();

        console.log(`--- User Comparison ---`);
        console.log(`users: ${usersCount} docs`);
        console.log(`v2_users: ${v2UsersCount} docs`);

        if (usersCount > 0 && v2UsersCount > 0) {
            const userSample = await usersCol.findOne({});
            const v2UserSample = await v2UsersCol.findOne({});

            console.log('\nSample [users]:', JSON.stringify(userSample, null, 2));
            console.log('\nSample [v2_users]:', JSON.stringify(v2UserSample, null, 2));

            // Check if same users exist in both
            const v2Emails = await v2UsersCol.distinct('email');
            const matchCount = await usersCol.countDocuments({ email: { $in: v2Emails } });
            console.log(`\nEmails in v2_users that also exist in users: ${matchCount}/${v2UsersCount}`);
        }

        await authDb.client.close();
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

compareUsers();
