
import { IngestAuditSchema } from '../src/lib/schemas';

async function verifyFix() {
    console.log('--- VERIFYING IngestAuditSchema FIX ---');
    
    const validStates = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'DUPLICATE'];
    
    for (const status of validStates) {
        try {
            const mockData = {
                tenantId: 'test-tenant',
                performedBy: 'test@example.com',
                filename: 'test.pdf',
                fileSize: 1024,
                md5: 'mock-md5',
                correlationId: 'test-uuid',
                status: status,
                details: {
                    duration_ms: 100
                },
                timestamp: new Date()
            };
            
            IngestAuditSchema.parse(mockData);
            console.log(`✅ Status "${status}" parsed successfully.`);
        } catch (error: any) {
            console.error(`❌ Status "${status}" failed validation.`);
            if (error.name === 'ZodError') {
                console.error(JSON.stringify(error.errors, null, 2));
            }
            process.exit(1);
        }
    }
    
    console.log('\n✨ All states verified successfully!');
}

verifyFix();
