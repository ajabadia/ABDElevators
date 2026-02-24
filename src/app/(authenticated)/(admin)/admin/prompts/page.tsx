import { enforcePermission } from "@/lib/guardian-guard";
import { PromptsHubClient } from "./PromptsHubClient";

/**
 * 📝 Prompts Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:prompts' before rendering.
 */
export default async function AdminPromptsPage() {
    await enforcePermission('admin:prompts', 'manage');

    return <PromptsHubClient />;
}
