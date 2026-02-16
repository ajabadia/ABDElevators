import { connectDB } from '../src/lib/db';
import { getTenantCollection } from '../src/lib/db-tenant';
import dotenv from 'dotenv';
const fs = require('fs');

dotenv.config({ path: '.env.local' });

async function debugRecentIngest() {
    const logPath = 'recent_assets_v2.log';
    let logBuffer = '';
    const log = (msg: string) => {
        logBuffer += msg + '\n';
        console.log(msg);
    };

    try {
        log('Starting Debug...');
        await connectDB();

        // Superadmin session
        const session = {
            user: {
                id: 'debug_context',
                email: 'debug@abd.com',
                tenantId: 'platform_master',
                role: 'SUPER_ADMIN'
            }
        };

        const assetsCollection = await getTenantCollection('knowledge_assets', session);
        const blobsCollection = await getTenantCollection('file_blobs', session);

        // Get last 10 assets
        const recentAssets = await assetsCollection.find(
            {},
            {
                sort: { createdAt: -1 },
                limit: 10,
                projection: {
                    filename: 1,
                    tenantId: 1,
                    scope: 1,
                    ingestionStatus: 1,
                    fileMd5: 1,
                    createdAt: 1,
                    cloudinaryUrl: 1,
                    sizeBytes: 1
                }
            }
        );

        log(`\n📄 Last 10 Knowledge Assets (${new Date().toISOString()}):`);
        for (const asset of recentAssets) {
            log(`- [${asset._id}] ${asset.filename}`);
            log(`  Tenant: ${asset.tenantId} | Scope: ${asset.scope} | Status: ${asset.ingestionStatus}`);
            log(`  MD5: ${asset.fileMd5} | Bytes: ${asset.sizeBytes}`);

            if (asset.fileMd5) {
                const blob = await blobsCollection.findOne({ _id: asset.fileMd5 });
                if (blob) {
                    log(`  ✅ Linked Blob Found: RefCount=${blob.refCount} | URL=${blob.cloudinaryUrl}`);
                } else {
                    log(`  ❌ NO BLOB FOUND for this MD5!`);
                    // Try RAW access to confirm hypothesis
                    try {
                        const rawBlob = await blobsCollection['collection'].findOne({ _id: asset.fileMd5 });
                        if (rawBlob) {
                            log(`  🛑 FOUND RAW BLOB (Invisible via SecureCollection)! TenantId: ${rawBlob.tenantId}`);
                        } else {
                            log(`  💀 REALLY NOT FOUND RAW.`);
                        }
                    } catch (e) { log(`Error querying raw: ${e}`); }
                }
            } else {
                log(`  ⚠️ No MD5 on asset`);
            }
            log('------------------------------------------------');
        }

        fs.writeFileSync(logPath, logBuffer);
        console.log(`Log written to ${logPath}`);

    } catch (error: any) {
        const errorMsg = `CRITICAL ERROR: ${error.message}\n${JSON.stringify(error, null, 2)}`;
        console.error(errorMsg);
        fs.writeFileSync(logPath, errorMsg);
    } finally {
        process.exit(0);
    }
}

debugRecentIngest();
