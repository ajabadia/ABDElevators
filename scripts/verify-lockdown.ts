import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

const privateRoutes = [
    '/dashboard',
    '/search',
    '/settings',
    '/admin/knowledge-assets',
    '/api/admin/logs'
];

const publicRoutes = [
    '/',
    '/login'
];

async function verifyLockdown() {
    console.log('🛡️  Starting Security Lockdown Verification...\n');

    for (const route of privateRoutes) {
        try {
            console.log(`🔍 Checking Private Route: ${route}`);
            const response = await axios.get(`${BASE_URL}${route}`, {
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 500
            });

            if (response.status === 307 || response.status === 302 || response.status === 401) {
                const location = response.headers.location || '';
                if (location.includes('/login') || response.status === 401) {
                    console.log(`✅ SUCCESS: ${route} is PROTECTED (Status: ${response.status}, Redirect: ${location})`);
                } else {
                    console.log(`⚠️  WARNING: ${route} protected but redirecting to unusual location: ${location}`);
                }
            } else if (response.status === 200) {
                console.log(`❌ FAILURE: ${route} is PUBLIC! (Status: 200)`);
            } else {
                console.log(`❓ UNKNOWN: ${route} returned status ${response.status}`);
            }
        } catch (error: any) {
            console.log(`❌ ERROR checking ${route}: ${error.message}`);
        }
    }

    console.log('\n🌐 Checking Public Routes...');
    for (const route of publicRoutes) {
        try {
            const response = await axios.get(`${BASE_URL}${route}`);
            if (response.status === 200) {
                console.log(`✅ SUCCESS: ${route} is PUBLIC (Status: 200)`);
            } else {
                console.log(`❌ FAILURE: ${route} returned status ${response.status}`);
            }
        } catch (error: any) {
            console.log(`❌ ERROR checking ${route}: ${error.message}`);
        }
    }
}

verifyLockdown();
