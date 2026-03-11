import { connectDB, connectConfigDB } from '../../src/lib/db';
import { KnowledgeAssetSchema } from '../../src/lib/schemas/assets';
import { EntityIdSchema, TenantIdSchema } from '../../src/lib/schemas/common';
import dotenv from 'dotenv';
import path from 'path';
import { ObjectId } from 'mongodb';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * 🚀 KNOWLEDGE ASSET v2 MIGRATION
 * Resolves orphaned assets and enforces relational integrity.
 */
async function run() {
    const mainDb = await connectDB();
    const configDb = await connectConfigDB();

    const assets = mainDb.collection("knowledgeassets");
    const spaces = configDb.collection("spaces");
    const docTypes = configDb.collection("document_types");

    const cursor = assets.find({});
    let migrated = 0;
    let softDeleted = 0;
    let errors = 0;

    console.log('🔄 Starting KnowledgeAsset v2 Migration...');

    while (await cursor.hasNext()) {
        const doc: any = await cursor.next();
        try {
            const tenantId = doc.tenantId || 'platform_master';

            // 1. Resolve spaceId
            let spaceId = doc.spaceId;
            if (!spaceId) {
                // Look for default space for this tenant
                const defaultSpace = await spaces.findOne({ tenantId, isDefault: true });
                if (!defaultSpace) {
                    // Create default space if missing
                    const res = await spaces.insertOne({
                        tenantId,
                        name: "Espacio General",
                        slug: "general",
                        type: "TENANT",
                        visibility: "INTERNAL",
                        isActive: true,
                        config: { isDefault: true, allowQuickQA: true },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    } as any);
                    spaceId = res.insertedId;
                    console.log(`✨ Created default space for tenant ${tenantId}`);
                } else {
                    spaceId = defaultSpace._id;
                }
            }

            // 2. Resolve documentTypeId
            let documentTypeId = doc.documentTypeId;
            if (!documentTypeId && doc.componentType) {
                const dt = await docTypes.findOne({ tenantId, name: doc.componentType });
                if (dt) {
                    documentTypeId = dt._id;
                }
            }

            // If still missing documentTypeId, use/create a generic one
            if (!documentTypeId) {
                const genericType = await docTypes.findOne({ tenantId, name: "General" });
                if (genericType) {
                    documentTypeId = genericType._id;
                } else {
                    const res = await docTypes.insertOne({
                        tenantId,
                        name: "General",
                        scope: "TENANT",
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    } as any);
                    documentTypeId = res.insertedId;
                    console.log(`✨ Created generic document type for tenant ${tenantId}`);
                }
            }

            // 3. Normalize and Validate
            const normalized = {
                ...doc,
                spaceId: spaceId.toString(),
                documentTypeId: documentTypeId.toString(),
                ownerId: doc.ownerUserId || doc.ownerId || 'system',
                source: doc.source || {
                    filename: doc.filename || 'unknown',
                    originalName: doc.filename || 'unknown',
                    mimeType: 'application/pdf',
                    sizeBytes: doc.sizeBytes || 0,
                    checksum: doc.fileMd5 || 'none',
                    storageProvider: 'cloudinary',
                    storageKey: doc.cloudinaryPublicId || 'none'
                },
                version: doc.version || 1,
                versionHistory: doc.versionHistory || []
            };

            // Remove legacy fields that might conflict
            delete normalized._id;

            const validated = KnowledgeAssetSchema.parse(normalized);

            await assets.updateOne(
                { _id: doc._id },
                { $set: validated }
            );

            migrated++;
        } catch (e: any) {
            console.error(`❌ Error migrating asset ${doc._id}:`, e.message);

            // Soft delete if non-recoverable
            await assets.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        deletedAt: new Date(),
                        migrationError: e.message,
                        status: 'FAILED'
                    }
                }
            );
            softDeleted++;
            errors++;
        }
    }

    console.log(`📊 Migration Summary:`);
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⚠️ Soft-Deleted/Failed: ${softDeleted}`);
    console.log(`❌ Errors: ${errors}`);
}

run().catch((e) => {
    console.error('💥 FATAL MIGRATION ERROR:', e);
    process.exit(1);
}).finally(() => {
    process.exit(0);
});
