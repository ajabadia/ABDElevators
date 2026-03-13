
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkUser() {
    const uri = process.env.MONGODB_AUTH_URI;
    if (!uri) {
        console.error('No MONGODB_AUTH_URI found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(); // It should use the default DB from URI
        const users = db.collection('users');
        
        console.log('Searching for superadmin@abd.com in AUTH cluster...');
        const user = await users.findOne({ email: 'superadmin@abd.com' });
        
        if (user) {
            console.log('User found:');
            console.log(JSON.stringify({
                _id: user._id,
                email: user.email,
                tenantId: user.tenantId,
                role: user.role,
                isActive: user.isActive
            }, null, 2));
        } else {
            console.log('User superadmin@abd.com NOT FOUND in "users" collection.');
            
            // List some users to see structure
            const someUsers = await users.find({}).limit(5).toArray();
            console.log('Sample users in "users" collection:', someUsers.map(u => ({ email: u.email, tenantId: u.tenantId })));
            
            // Check v2_users just in case
            const v2users = db.collection('v2_users');
            const userV2 = await v2users.findOne({ email: 'superadmin@abd.com' });
            if (userV2) {
                console.log('User found in v2_users:');
                console.log(JSON.stringify(userV2, null, 2));
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkUser();
