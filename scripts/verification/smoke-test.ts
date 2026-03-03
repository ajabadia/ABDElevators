import { PDFExtractionEngine } from '@/lib/pdf-extraction-engine';
import { TicketService } from '@/services/support/TicketService';
import { AuditTrailService } from '@/services/observability/AuditTrailService';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * 🧪 Platform Smoke Test
 * Finalidad: Verificación rápida de flujos críticos post-refactor.
 */
async function runSmokeTest() {
    console.log('🚀 Iniciando Smoke Test...');
    const cid = CorrelationIdService.generate('SMOKE-TEST');

    try {
        // 1. Ingestión (Simulada)
        console.log('- Probando Ingestión PDF...');
        // Simulamos un buffer mínimo
        const mockBuffer = Buffer.from('%PDF-1.4...');
        // NOTE: Make sure PDFExtractionEngine refers to the new modular service if applicable
        const text = await PDFExtractionEngine.extractText(mockBuffer);
        if (typeof text !== 'string') throw new Error('Fallo extracción PDF');

        // 2. Soporte
        console.log('- Probando Ciclo de Tickets...');
        // Note: Replace with actual TicketService call signature if it changed
        const ticketId = await TicketService.createTicket({
            tenantId: 'test-tenant',
            subject: 'Smoke Test Ticket',
            description: 'Automated validation',
            priority: 'LOW',
            userId: 'system-agent'
        }, cid);
        if (!ticketId) throw new Error('Fallo creación Ticket');

        // 3. Auditoría
        console.log('- Probando Persistencia de Auditoría...');
        await AuditTrailService.logAdminOp({
            actorType: 'SYSTEM',
            actorId: 'SMOKE_TEST_ENGINE',
            tenantId: 'platform_master',
            action: 'RUN_SMOKE_TEST',
            entityType: 'TEST',
            entityId: cid,
            changes: { status: 'STARTED' },
            reason: 'Verificación de integridad post-refactor',
            correlationId: cid
        });

        console.log('✅ Smoke Test completado con éxito.');
    } catch (error: any) {
        console.error('❌ Smoke Test FALLIDO:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runSmokeTest();
}
