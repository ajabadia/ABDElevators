import { NotificationService } from '../src/lib/notification-service';
import { connectDB } from '../src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedNotifications() {
    console.log("🚀 Iniciando seeding de notificaciones...");
    const correlacion_id = uuidv4();
    const db = await connectDB();

    // Obtener un usuario de prueba (TECNICO)
    const user = await db.collection("usuarios").findOne({ rol: 'TECNICO' });
    if (!user) {
        console.error("❌ No se encontró ningún usuario con rol TECNICO. Ejecuta seed-users primero.");
        process.exit(1);
    }

    const tenantId = user.tenantId;
    const usuarioId = user._id.toString();

    // Inyectar tenantId para que NotificationService funcione en modo script
    process.env.SINGLE_TENANT_ID = tenantId;

    const mockNotifications = [
        {
            tenantId,
            userId: usuarioId, // Rename
            type: 'ANALYSIS_COMPLETE' as const, // Fix Enum
            level: 'INFO' as const, // Fix Enum
            title: 'Nuevo Entity Asignado',
            message: 'El pedido #ABC-999 se ha movido al estado "analizado" y requiere tu validación.',
            link: `/pedidos/${usuarioId}/validar`
        },
        {
            tenantId,
            userId: usuarioId,
            type: 'SYSTEM' as const,
            level: 'INFO' as const,
            title: 'Actualización de Plataforma',
            message: 'Se ha habilitado el nuevo motor de transiciones 7.2. Ya puedes gestionar transiciones dinámicas.',
        },
        {
            tenantId,
            userId: usuarioId,
            type: 'SECURITY_ALERT' as const,
            level: 'WARNING' as const,
            title: 'Respuesta a tu consulta',
            message: 'El administrador ha respondido a tu consulta sobre el pedido #4456.',
            link: '/perfil'
        }
    ];

    console.log(`Inserting ${mockNotifications.length} notifications for user ${user.email}...`);

    for (const n of mockNotifications) {
        // @ts-ignore - Ignore exact type mismatch for specific metadata in seed script
        await NotificationService.notifyInApp(n, correlacion_id);
    }

    console.log("✅ Seeding completado.");
    process.exit(0);
}

seedNotifications().catch(err => {
    console.error("❌ Error en seeding:", err);
    process.exit(1);
});
