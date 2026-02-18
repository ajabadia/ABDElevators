import { IKnowledgeRepository } from '../../domain/repositories/IKnowledgeRepository';
import { KnowledgeAsset, IndustryType, KnowledgeAssetSchema } from '@/lib/schemas';
import { getTenantCollection } from '@/lib/db-tenant';
import { ObjectId } from 'mongodb';

export class MongoKnowledgeRepository implements IKnowledgeRepository {
    async findByHash(hash: string, tenantId: string): Promise<any | null> {
        const collection = await getTenantCollection('knowledge_assets', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        return await collection.findOne({ fileMd5: hash });
    }

    async create(data: any): Promise<KnowledgeAsset> {
        const collection = await getTenantCollection('knowledge_assets', { user: { id: 'system', tenantId: data.tenantId, role: 'SYSTEM' } } as any);
        const result = await collection.insertOne(data);
        return { ...data, _id: result.insertedId } as KnowledgeAsset;
    }

    async search(query: any, tenantId: string): Promise<any[]> {
        const collection = await getTenantCollection('knowledge_assets', { user: { id: 'system', tenantId, role: 'SYSTEM' } } as any);
        return await collection.find(query) as unknown as any[];
    }

    async findAll(params: { tenantId?: string, limit: number, skip: number }): Promise<{ assets: KnowledgeAsset[], total: number }> {
        // If tenantId is provided, we use it for getTenantCollection to ensure isolation.
        // If not provided (SuperAdmin), we might need a broader access or handling.
        // For now, assuming provided tenantId or 'platform_master' if relying on session in getTenantCollection

        // Note: getTenantCollection relies on session to enforce security. 
        // If we want to support "SuperAdmin sees all", we rely on SecureCollection's logic.

        const dbCtx = { user: { id: 'system', tenantId: params.tenantId || 'platform_master', role: 'SYSTEM' } };
        const collection = await getTenantCollection('knowledge_assets', dbCtx as any);

        // SecureCollection.find already applies tenant filters based on the session/context provided.
        // If params.tenantId is specific, SecureCollection ensures we only see that tenant's data.

        const filter = {}; // Additional filters can go here

        const [assets, total] = await Promise.all([
            collection.find(filter, { limit: params.limit, skip: params.skip, sort: { createdAt: -1 } }) as unknown as Promise<KnowledgeAsset[]>,
            collection.countDocuments(filter)
        ]);

        return { assets, total };
    }

    private collectionName = 'knowledge_assets';

    private async getCollection() {
        return await getTenantCollection<any>(this.collectionName);
    }

    async findById(id: string): Promise<KnowledgeAsset | null> {
        const collection = await this.getCollection();
        const doc = await collection.findOne({ _id: new ObjectId(id) });
        if (!doc) return null;
        return KnowledgeAssetSchema.parse(doc);
    }

    async findByMd5(md5: string, tenantId: string): Promise<KnowledgeAsset | null> {
        const collection = await this.getCollection();
        const doc = await collection.findOne({ fileMd5: md5, tenantId });
        if (!doc) return null;
        return KnowledgeAssetSchema.parse(doc);
    }

    async save(asset: KnowledgeAsset): Promise<KnowledgeAsset> {
        const collection = await this.getCollection();
        const { _id, ...data } = asset;

        if (_id) {
            await collection.updateOne(
                { _id: new ObjectId(_id as string) },
                { $set: { ...data, updatedAt: new Date() } },
                { upsert: true }
            );
            return asset;
        } else {
            const result = await collection.insertOne({
                ...data as any,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { ...asset, _id: result.insertedId };
        }
    }

    async updateStatus(id: string, status: KnowledgeAsset['ingestionStatus'], details?: Partial<KnowledgeAsset>): Promise<void> {
        const collection = await this.getCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ingestionStatus: status,
                    ...details,
                    updatedAt: new Date()
                }
            }
        );
    }

    async updateProgress(id: string, progress: number): Promise<void> {
        const collection = await this.getCollection();
        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { progress, updatedAt: new Date() } }
        );
    }

    async findActiveByIndustry(industry: IndustryType, tenantId: string): Promise<KnowledgeAsset[]> {
        const collection = await this.getCollection();
        const docs = await collection.find({
            industry,
            tenantId,
            ingestionStatus: 'COMPLETED',
            deletedAt: { $exists: false }
        } as any);

        return docs.map((doc: any) => KnowledgeAssetSchema.parse(doc));
    }
}
