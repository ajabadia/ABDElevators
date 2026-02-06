import { connectDB } from '../lib/db';
import { logEvento } from '../lib/logger';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    const correlationId = 'AUDIT_PROMPTS_' + Date.now();
    console.log(`🔍 Starting database prompt audit (Correlation: ${correlationId})`);

    try {
        const db = await connectDB();
        const collection = db.collection('prompts');

        // Find prompts with technical terms
        const query = {
            $or: [
                { name: { $regex: /RAG|Explorer|Simulator|Agentic|Vector/i } },
                { description: { $regex: /RAG|Explorer|Simulator|Agentic|Vector/i } }
            ]
        };

        const prompts = await collection.find(query).toArray();
        console.log(`📋 Found ${prompts.length} prompts to modernize.`);

        for (const prompt of prompts) {
            const oldName = prompt.name;
            const oldDesc = prompt.description;

            // Modernize logic
            const newName = oldName
                .replace(/RAG/g, 'Intelligence')
                .replace(/Explorer/g, 'Search')
                .replace(/Simulator/g, 'Analysis Simulator')
                .replace(/Agentic/g, 'Intelligent')
                .replace(/Vector/g, 'Semantic');

            const newDesc = oldDesc ? oldDesc
                .replace(/RAG/g, 'Intelligence')
                .replace(/Explorer/g, 'Search')
                .replace(/Simulator/g, 'Analysis Simulator')
                .replace(/Agentic/g, 'Intelligent')
                .replace(/Vector/g, 'Semantic') : '';

            console.log(`📝 Updating: [${oldName}] -> [${newName}]`);

            await collection.updateOne(
                { _id: prompt._id },
                {
                    $set: {
                        name: newName,
                        description: newDesc,
                        lastAudit: new Date(),
                        auditedBy: 'TERMINOLOGY_PURGE_BOT'
                    }
                }
            );
        }

        await logEvento({
            level: 'INFO',
            source: 'PROMPT_AUDIT_SCRIPT',
            action: 'AUDIT_COMPLETE',
            message: `Audited and modernized ${prompts.length} prompts in database.`,
            correlationId
        });

        console.log('✅ Prompt audit completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Audit failed:', error);
        process.exit(1);
    }
}

main();
