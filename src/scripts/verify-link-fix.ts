
import { connectDB } from '../lib/db';
import { SpaceService } from '../services/tenant/space-service';
import { assetSpaceLinkRepository } from '../lib/repositories/AssetSpaceLinkRepository';
import { ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

async function verifyLinkFix() {
    const db = await connectDB();
    const results: any = {
        action: 'link_test',
        found_asset: false,
        link_result: null,
        error: null
    };
    
    console.log('--- VERIFY LINK ASSET TO SPACE FIX ---');
    
    // Find the asset by name
    const asset = await db.collection('knowledge_assets').findOne({
        'source.filename': { $regex: '2024-06-06_JORNADA', $options: 'i' }
    });
    
    if (!asset) {
        console.log('Asset not found');
        return;
    }
    results.found_asset = true;
    
    const session = { user: { id: 'system', tenantId: asset.tenantId, role: 'SUPER_ADMIN' } };
    const spaceId = "6996c8f503d7d461b0b15564"; // Known valid spaceId in CONFIG

    try {
        // Test linking
        const linkId = await SpaceService.linkAssetToSpace(
            asset._id as any,
            spaceId as any,
            asset.tenantId as any,
            session as any
        );
        results.link_result = { success: true, linkId };
        console.log(`Link created: ${linkId}`);
    } catch (err: any) {
        results.error = { message: err.message, stack: err.stack };
        console.error(`Link failed: ${err.message}`);
    }
    
    fs.writeFileSync('verify_link_results.json', JSON.stringify(results, null, 2));
    process.exit(0);
}

verifyLinkFix().catch(err => {
    console.error(err);
    process.exit(1);
});
