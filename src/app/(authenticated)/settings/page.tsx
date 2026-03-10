import { SettingsHubClient } from "./SettingsHubClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * ⚙️ Settings Hub (Era 12)
 * Refactored to Server Component for HubPage standardization.
 * Management sub-routes are protected by specific permissions in their own pages.
 */
export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return <SettingsHubClient />;
}
