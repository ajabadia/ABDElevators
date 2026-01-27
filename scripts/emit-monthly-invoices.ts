
import { config } from 'dotenv';
config({ path: '.env.local' });

import { connectDB } from '../src/lib/db';
import { BillingService } from '../src/lib/billing-service';
import { sendNewInvoiceNotification } from '../src/lib/email-service';
import { getTenantCollection } from '../src/lib/db-tenant';

async function main() {
    console.log('🚀 Iniciando Emisión de Facturas Mensuales...');

    try {
        await connectDB();

        // 1. Obtener todos los tenants (Simulado: iterar collection 'tenants' global)
        const db = await connectDB();
        const tenants = await db.collection('tenants').find({ active: true }).toArray();

        console.log(`📋 Encontrados ${tenants.length} tenants activos.`);

        const date = new Date();
        const monthName = date.toLocaleString('es-ES', { month: 'long' });

        for (const tenant of tenants) {
            console.log(`Processing tenant: ${tenant.name} (${tenant.tenantId})`);

            // 2. Calcular Factura
            // Usamos generateInvoicePreview por ahora ya que no persistimos histórico real aún
            const invoice = await BillingService.generateInvoicePreview(
                tenant.tenantId,
                date.getMonth() + 1,
                date.getFullYear()
            );

            if (invoice.total > 0) {
                // 3. Enviar Email
                console.log(`   📧 Enviando factura ${invoice.number} de ${invoice.total} EUR a ${tenant.email || 'admin@example.com'}`);

                // Simular envío si no hay email real, o usar email del tenant
                const emailToSend = tenant.email || process.env.RESEND_TEST_EMAIL || 'test@example.com';

                await sendNewInvoiceNotification({
                    to: emailToSend,
                    tenantName: tenant.name,
                    invoiceNumber: invoice.number,
                    amount: invoice.total,
                    currency: invoice.currency,
                    month: monthName
                });
                console.log('   ✅ Email enviado.');
            } else {
                console.log('   ℹ️ Factura importe 0, saltando email.');
            }
        }

        console.log('🏁 Proceso finalizado correctamente.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}

main();
