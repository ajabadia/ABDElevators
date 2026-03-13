
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkUser() {
    const uri = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('No MONGODB_AUTH_URI found');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        
        // 🛡️ Try AUTH database
        const authDb = client.db('ABDElevators-Auth');
        const usersAuth = authDb.collection('users');
        
        console.log('Searching for superadmin@abd.com in ABDElevators-Auth...');
        const userAuth = await usersAuth.findOne({ email: 'superadmin@abd.com' });
        
        if (userAuth) {
            console.log('User found in ABDElevators-Auth:');
            console.log(JSON.stringify({
                _id: userAuth._id,
                email: userAuth.email,
                tenantId: userAuth.tenantId,
                role: userAuth.role
            }, null, 2));
        } else {
            console.log('User NOT FOUND in ABDElevators-Auth.');
        }

        // 🛡️ Try MAIN database as fallback
        const mainDb = client.db('ABDElevators');
        const usersMain = mainDb.collection('users');
        console.log('Searching for superadmin@abd.com in ABDElevators (Main)...');
        const userMain = await usersMain.findOne({ email: 'superadmin@abd.com' });
        
        if (userMain) {
            console.log('User found in ABDElevators (Main):');
            console.log(JSON.stringify({
                _id: userMain._id,
                email: userMain.email,
                tenantId: userMain.tenantId,
                role: userMain.role
            }, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkUser();
