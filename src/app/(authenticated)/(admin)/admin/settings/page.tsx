import { enforcePermission } from "@/lib/guardian-guard";
import { SettingsHubClient } from "./SettingsHubClient";

/**
 * ⚙️ Settings Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:settings' before rendering.
 */
export default async function SettingsPage() {
    await enforcePermission('admin:settings', 'manage');

    return <SettingsHubClient />;
}
