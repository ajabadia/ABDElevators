import { requirePermission } from "@/lib/auth";
import ApiKeysClient from "./ApiKeysClient";
import { getApiKeys } from "@/actions/api-keys";
import { SpaceService } from "@/services/tenant/space-service";
import { auth } from "@/lib/auth";
import { TenantIdSchema, EntityIdSchema } from "@abd/platform-core";

/**
 * 🔑 API Keys Management Page (Server-Side Enforced)
 * Consolidates all API keys under a secure canonical route.
 * Enforces 'admin:api_keys' permission before execution.
 */
export default async function ApiKeysPage() {
    await requirePermission('admin:api_keys', 'manage');

    const session = await auth();

    // Rule 18 Alignment: Strict Branding
    const tenantId = TenantIdSchema.parse(session?.user?.tenantId || '');
    const userId = EntityIdSchema.parse(session?.user?.id || '');

    const [keys, spaces] = await Promise.all([
        getApiKeys(),
        SpaceService.getAccessibleSpaces(tenantId, userId)
    ]);

    return <ApiKeysClient initialKeys={keys as any[]} initialSpaces={spaces as any[]} />;
}
