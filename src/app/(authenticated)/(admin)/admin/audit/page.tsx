import { enforcePermission } from "@/lib/guardian-guard";
import { AuditClient } from "./AuditClient";

/**
 * 🔍 Registro de Auditoría (Server-Side Enforced)
 * Enforces Guardian policy 'admin:audit' before rendering.
 */
export default async function AuditoriaPage() {
    await enforcePermission('admin:audit', 'read');

    return <AuditClient />;
}
