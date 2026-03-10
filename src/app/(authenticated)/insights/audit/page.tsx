import { requirePermission } from '@/lib/auth';
import { AuditClient } from "./AuditClient";

/**
 * 🔍 Registro de Auditoría (Server-Side Enforced)
 * Enforces Guardian policy 'admin:audit' before rendering.
 */
export default async function AuditoriaPage() {
    await requirePermission('admin:audit', 'read');

    return <AuditClient />;
}
