import { enforcePermission } from "@/lib/guardian-guard";
import { redirect } from "next/navigation";

/**
 * ⚙️ Settings Redirect (Unified Experience)
 * Users going to /admin/settings are now sent to the unified /settings.
 */
export default async function SettingsPage() {
    await enforcePermission('admin:settings', 'manage');
    redirect('/settings');
}
