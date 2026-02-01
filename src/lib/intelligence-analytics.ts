
import { connectDB } from './db';
import { FederatedPattern } from './schemas';
import { ObjectId } from 'mongodb';

export interface IntelligenceStats {
    totalPatterns: number;
    validatedPatterns: number;
    patternsLast7Days: number;
    averageConfidence: number;
    topTags: { tag: string; count: number }[];
}

export class IntelligenceAnalyticsService {

    /**
     * Get aggregate statistics for the dashboard.
     */
    static async getStats(): Promise<IntelligenceStats> {
        const db = await connectDB();
        const collection = db.collection('federated_patterns');

        const totalPatterns = await collection.countDocuments({ status: { $ne: 'ARCHIVED' } });

        // Count patterns with at least one validation
        const validatedPatterns = await collection.countDocuments({
            status: { $ne: 'ARCHIVED' },
            validationCount: { $gt: 0 }
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const patternsLast7Days = await collection.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
            status: { $ne: 'ARCHIVED' }
        });

        // Calculate average confidence score
        const confidenceResult = await collection.aggregate([
            { $match: { status: { $ne: 'ARCHIVED' } } },
            { $group: { _id: null, avgConfidence: { $avg: "$confidenceScore" } } }
        ]).toArray();
        const averageConfidence = confidenceResult.length > 0 ? confidenceResult[0].avgConfidence : 0;

        // Get top tags
        const tagsResult = await collection.aggregate([
            { $match: { status: { $ne: 'ARCHIVED' } } },
            { $unwind: "$keywords" },
            { $group: { _id: "$keywords", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).toArray();

        const topTags = tagsResult.map(t => ({ tag: t._id, count: t.count }));

        return {
            totalPatterns,
            validatedPatterns,
            patternsLast7Days,
            averageConfidence,
            topTags
        };
    }

    /**
     * List patterns with pagination and filtering.
     */
    static async getPatterns(page: number, limit: number, sortBy: string = 'validationCount', sortOrder: 'asc' | 'desc' = 'desc') {
        const db = await connectDB();
        const collection = db.collection('federated_patterns');
        const skip = (page - 1) * limit;

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const patterns = await collection.find({ status: { $ne: 'ARCHIVED' } })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await collection.countDocuments({ status: { $ne: 'ARCHIVED' } });

        return {
            patterns: patterns as unknown as FederatedPattern[],
            total,
            pages: Math.ceil(total / limit)
        };
    }

    /**
     * Archive or Moderate a pattern.
     */
    static async moderatePattern(patternId: string, action: 'ARCHIVE' | 'EDIT', updates?: any) {
        const db = await connectDB();
        const collection = db.collection('federated_patterns');

        if (action === 'ARCHIVE') {
            await collection.updateOne(
                { _id: new ObjectId(patternId) },
                { $set: { status: 'ARCHIVED', updatedAt: new Date() } }
            );
        } else if (action === 'EDIT' && updates) {
            await collection.updateOne(
                { _id: new ObjectId(patternId) },
                { $set: { ...updates, updatedAt: new Date() } }
            );
        }
    }
}
