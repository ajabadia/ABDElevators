import { AgenticRAGService } from '../src/lib/langgraph-rag';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testFix() {
    try {
        console.log("🚀 Testing AgenticRAG Query Transformation...");
        const result = await AgenticRAGService.run(
            "¿Cuál es el modelo de motor para el ascensor de 630kg?",
            "default_tenant",
            "test-correlation-id-" + Date.now(),
            [],
            "ELEVATORS",
            "PRODUCTION"
        );

        console.log("✅ RAG Execution Trace:");
        result.trace.forEach((t: string) => console.log(`   - ${t}`));

        console.log("\n📄 Generation Output:");
        console.log(result.generation);

        process.exit(0);
    } catch (error: any) {
        console.error("❌ RAG Execution Failed:", error);
        process.exit(1);
    }
}

testFix();
