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
            usuarioId,
            tipo: 'WORKFLOW' as const,
            prioridad: 'HIGH' as const,
            titulo: 'Nuevo Pedido Asignado',
            mensaje: 'El pedido #ABC-999 se ha movido al estado "analizado" y requiere tu validación.',
            link: `/pedidos/${usuarioId}/validar` // Placeholder id
        },
        {
            tenantId,
            usuarioId,
            tipo: 'SISTEMA' as const,
            prioridad: 'LOW' as const,
            titulo: 'Actualización de Plataforma',
            mensaje: 'Se ha habilitado el nuevo motor de transiciones 7.2. Ya puedes gestionar transiciones dinámicas.',
        },
        {
            tenantId,
            usuarioId,
            tipo: 'SOPORTE' as const,
            prioridad: 'MEDIUM' as const,
            titulo: 'Respuesta a tu consulta',
            mensaje: 'El administrador ha respondido a tu consulta sobre el pedido #4456.',
            link: '/perfil'
        }
    ];

    console.log(`Inserting ${mockNotifications.length} notifications for user ${user.email}...`);

    for (const n of mockNotifications) {
        await NotificationService.notifyInApp(n, correlacion_id);
    }

    console.log("✅ Seeding completado.");
    process.exit(0);
}

seedNotifications().catch(err => {
    console.error("❌ Error en seeding:", err);
    process.exit(1);
});
