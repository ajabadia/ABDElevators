import { requirePermission } from '@/lib/auth';
import { PromptsHubClient } from "./PromptsHubClient";

/**
 * 📝 Prompts Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:prompts' before rendering.
 */
export default async function AdminPromptsPage() {
    await requirePermission('admin:prompts', 'manage');

    return <PromptsHubClient />;
}
