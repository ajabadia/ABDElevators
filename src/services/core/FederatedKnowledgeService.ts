import crypto from 'node:crypto';
import { FederatedPattern, FederatedPatternSchema, IndustryType } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { getTenantCollection } from '@/lib/db-tenant';
import { connectDB } from '@/lib/db';
import { generateEmbedding } from '@/services/llm/llm-service';
import { ApplicationLogSchema } from '@/lib/schemas';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODEL_IDS } from '@abd/platform-core';
import { ObjectId } from 'mongodb';

// Initialize Gemini for Anonymization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * 🌐 FederatedKnowledgeService
 * Manages Cross-Tenant Knowledge Patterns.
 * Strip PII, generalize technical concepts, and share anonymously.
 */
export class FederatedKnowledgeService {
    private static async log(data: { level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', action: string, message: string, correlationId?: string, tenantId?: string, details?: any }) {
        return logEvento({
            source: 'FEDERATED_KNOWLEDGE',
            ...data
        });
    }

    /**
     * Extracts a generic, anonymous pattern from a specific ticket solution.
     * Uses LLM to strip PII and generalize the technical concept.
     */
    static async extractPatternFromResolution(
        ticketDescription: string,
        ticketSolution: string,
        tenantId: string,
        industry: IndustryType = 'ELEVATORS'
    ): Promise<FederatedPattern | null> {

        const correlationId = CorrelationIdService.generate();
        await this.log({
            level: 'INFO',
            action: 'EXTRACT_PATTERN_START',
            message: `Starting pattern extraction for tenant ${tenantId}`,
            correlationId,
            tenantId
        });

        try {
            const model = genAI.getGenerativeModel({ model: AI_MODEL_IDS.GEMINI_1_5_PRO });

            const prompt = `
            You are a Technical Knowledge Architect for the ${industry} industry.
            Your goal is to extract a generic, ANONYMOUS technical pattern from a specific ticket resolution.

            INPUT TICKET:
            "${ticketDescription}"

            INPUT SOLUTION:
            "${ticketSolution}"

            INSTRUCTIONS:
            1. Analyze the core technical root cause and the effective solution.
            2. REMOVE all specific names, brands (unless industry standard), serial numbers, building names, addresses, or dates.
            3. GENERALIZE the problem (e.g., "Error 504 on Schindler 3300" -> "Bio-bus communication timeout on controller").
            4. GENERALIZE the solution.
            5. Extract 3-5 technical keywords.

            OUTPUT JSON:
            {
                "problemVector": "Short generic description of the problem",
                "solutionVector": "Short generic description of the fix",
                "keywords": ["tag1", "tag2", "tag3"],
                "confidence": 0.95 (0-1 score of how reusable this is)
            }
            `;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Basic JSON cleaning
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            if (data.confidence < 0.7) {
                await this.log({
                    level: 'INFO',
                    action: 'EXTRACT_PATTERN_LOW_CONFIDENCE',
                    message: `Low confidence (${data.confidence}), skipping pattern.`,
                    correlationId,
                    tenantId,
                    details: { confidence: data.confidence }
                });
                return null;
            }

            // Generate Embedding for semantic search
            const embeddingText = `Problem: ${data.problemVector}. Solution: ${data.solutionVector}`;
            const embedding = await generateEmbedding(embeddingText, tenantId, correlationId);

            // Hash tenant ID for anonymous attribution
            const originTenantHash = crypto.createHash('sha256').update(tenantId).digest('hex');

            const pattern: FederatedPattern = {
                problemVector: data.problemVector,
                solutionVector: data.solutionVector,
                keywords: data.keywords,
                embedding: embedding,
                confidenceScore: data.confidence,
                originTenantHash: originTenantHash,
                originIndustry: industry,
                status: 'PUBLISHED', // Direct publish for beta
                validationCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validate with Zod
            const validated = FederatedPatternSchema.parse(pattern);

            // Save to DB
            const db = await connectDB();
            await db.collection('federated_patterns').insertOne(validated);

            await this.log({
                level: 'INFO',
                action: 'EXTRACT_PATTERN_SUCCESS',
                message: `Successfully extracted and saved pattern.`,
                correlationId,
                tenantId,
                details: { patternId: (validated as any)._id, problemVector: validated.problemVector }
            });

            return validated;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.log({
                level: 'ERROR',
                action: 'EXTRACT_PATTERN_ERROR',
                message: `Error extracting federated pattern: ${errorMessage}`,
                correlationId,
                tenantId,
                details: { error: errorMessage }
            });
            return null;
        }
    }

    /**
     * Search for patterns in the global registry using Atlas Vector Search.
     * Fallback to keyword filtering if vector search fails or returns no results.
     */
    static async searchGlobalPatterns(query: string, tenantId: string, correlationId: string, limit: number = 3): Promise<FederatedPattern[]> {
        const db = await connectDB();
        const collection = db.collection('federated_patterns');

        await this.log({
            level: 'INFO',
            action: 'FEDERATED_SEARCH_STARTED',
            message: `Starting federated search for query: ${query.substring(0, 30)}...`,
            correlationId,
            tenantId
        });

        try {
            // 1. Generate query embedding
            const queryEmbedding = await generateEmbedding(query, tenantId, correlationId);

            // 2. Vector Search (Using Atlas native $vectorSearch)
            const pipeline = [
                {
                    $vectorSearch: {
                        index: "federated_vector_index", // Infrastructure requirement
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: limit,
                        filter: { status: 'PUBLISHED' }
                    }
                },
                {
                    $addFields: {
                        score: { $meta: "vectorSearchScore" }
                    }
                }
            ];

            const results = await collection.aggregate(pipeline).toArray();

            if (results.length > 0) {
                await this.log({
                    level: 'INFO',
                    action: 'FEDERATED_SEARCH_VECTOR_SUCCESS',
                    message: `Vector search returned ${results.length} results.`,
                    correlationId,
                    tenantId,
                    details: { query, resultCount: results.length }
                });
                return results as unknown as FederatedPattern[];
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn("[Federated] Vector search failed or index missing, falling back to keyword search.", errorMessage);
        }

        // 3. Fallback: Keyword Search (regex on problemVector or keywords)
        // This ensures the system works even before indices are fully built
        const fallback = await collection.find({
            status: 'PUBLISHED',
            $or: [
                { problemVector: { $regex: query, $options: 'i' } },
                { keywords: { $in: [query.toLowerCase()] } }
            ]
        })
            .sort({ validationCount: -1, confidenceScore: -1 })
            .limit(limit)
            .toArray();

        return fallback as unknown as FederatedPattern[];
    }

    /**
     * Validates a pattern as useful, increasing its reputation.
     * Core of the Cross-Tenant Peer Review system.
     */
    static async validatePattern(patternId: string, tenantId: string): Promise<boolean> {
        try {
            const db = await connectDB();
            const collection = db.collection('federated_patterns');

            const result = await collection.updateOne(
                { _id: new ObjectId(patternId), status: 'PUBLISHED' },
                {
                    $inc: { validationCount: 1 },
                    $set: { updatedAt: new Date() }
                }
            );

            return result.modifiedCount > 0;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("[Federated] Validation error:", errorMessage);
            return false;
        }
    }

    private static cosineSimilarity(vecA: number[], vecB: number[]) {
        if (!vecB || vecB.length === 0) return 0;
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * (vecB[i] || 0);
            magnitudeA += vecA[i] * vecA[i];
            magnitudeB += (vecB[i] || 0) * (vecB[i] || 0);
        }
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        if (magnitudeA && magnitudeB) return dotProduct / (magnitudeA * magnitudeB);
        return 0;
    }
}
