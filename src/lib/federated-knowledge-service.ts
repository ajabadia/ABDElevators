import { FederatedPattern, FederatedPatternSchema, IndustryType } from './schemas';
import { connectDB } from './db';
import { generateEmbedding } from './llm';
import { ApplicationLogSchema } from './schemas';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for Anonymization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class FederatedKnowledgeService {

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

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
                console.log(`[Federated] Low confidence (${data.confidence}), skipping pattern.`);
                return null;
            }

            // Generate Embedding for semantic search
            const correlationId = crypto.randomUUID();
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

            return validated;

        } catch (error) {
            console.error("Error extracting federated pattern:", error);
            return null;
        }
    }

    /**
     * Search for patterns in the global registry.
     * Uses Vector Search if available, otherwise fallback to Text Search (keywords).
     */
    static async searchGlobalPatterns(query: string, tenantId: string, correlationId: string, limit: number = 3): Promise<FederatedPattern[]> {
        const db = await connectDB();

        // 1. Generate query embedding
        const queryEmbedding = await generateEmbedding(query, tenantId, correlationId);

        // 2. Vector Search (Simulated for now with basic filter if no vector index)
        // In real Prod: db.collection.aggregate([{$vectorSearch: ...}])

        const patterns = await db.collection('federated_patterns')
            .find({ status: 'PUBLISHED' })
            .limit(limit * 2)
            .toArray();

        // Basic cosine similarity ranking (in-memory for v1 MVP)
        const ranked = patterns.map(p => ({
            ...p,
            similarity: this.cosineSimilarity(queryEmbedding, p.embedding || [])
        }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        return ranked as unknown as FederatedPattern[];
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
