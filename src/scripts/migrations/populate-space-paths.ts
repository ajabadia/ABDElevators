import { connectDB } from '../../lib/db';
import { KnowledgeAssetRepository } from '../../lib/repositories/KnowledgeAssetRepository';
import { SpaceRepository } from '../../lib/repositories/SpaceRepository';
import { DocumentChunkRepository } from '../../lib/repositories/DocumentChunkRepository';
import { AssetSpaceLinkRepository } from '../../lib/repositories/AssetSpaceLinkRepository';
import { logEvento } from '../../lib/logger';

async function migrate() {
    console.log('🚀 Starting Phase 344 Migration: Populate SpacePaths');
    const correlationId = 'migration-p344-' + Date.now();

    try {
        await connectDB();
        const assetRepo = new KnowledgeAssetRepository();
        const spaceRepo = new SpaceRepository();
        const chunkRepo = new DocumentChunkRepository();
        const linkRepo = new AssetSpaceLinkRepository();

        // 1. Get all assets
        const assets = await assetRepo.list({ filter: { isDeleted: false }, limit: 10000 });
        console.log(`📦 Found ${assets.length} assets to migrate.`);

        for (const asset of assets) {
            if (!asset._id || !asset.spaceId) {
                console.warn(`⚠️ Asset ${asset._id || 'unknown'} has no spaceId. Skipping.`);
                continue;
            }

            // 2. Get space materializedPath
            const space = await spaceRepo.findById(asset.spaceId.toString());
            if (!space) {
                console.warn(`❌ Space ${asset.spaceId} not found for asset ${asset._id}.`);
                continue;
            }

            const spacePath = space.materializedPath;
            if (!spacePath) {
                console.warn(`⚠️ Space ${asset.spaceId} has no materializedPath. Skipping.`);
                continue;
            }

            console.log(`🔄 Updating Asset ${asset.filename} with path ${spacePath}`);

            // 3. Update asset
            await assetRepo.update(asset._id.toString(), { spacePath });

            // 4. Update chunks
            await chunkRepo.updatePaths(asset._id.toString(), spacePath);

            // 5. Create primary link if not exists
            const existingLinks = await linkRepo.list({
                filter: { assetId: asset._id, spaceId: asset.spaceId, isDeleted: false }
            });

            if (existingLinks.length === 0) {
                await linkRepo.create({
                    assetId: asset._id as any,
                    spaceId: asset.spaceId as any,
                    spacePath,
                    isPrimary: true,
                    tenantId: asset.tenantId as any,
                    isDeleted: false,
                    createdAt: new Date()
                });
            } else {
                // Update path of existing links
                for (const link of existingLinks) {
                    if (link._id) {
                        await linkRepo.update(link._id.toString(), { spacePath });
                    }
                }
            }
        }

        console.log('✅ Migration completed successfully.');
        await logEvento({
            level: 'INFO',
            source: 'MIGRATION',
            action: 'POPULATE_SPACE_PATHS',
            message: 'Phase 344 Migration completed',
            correlationId,
            details: { count: assets.length }
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate().then(() => process.exit(0));
