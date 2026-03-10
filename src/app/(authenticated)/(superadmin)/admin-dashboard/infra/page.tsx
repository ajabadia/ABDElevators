import { redirect } from "next/navigation";

/**
 * 🛰️ Admin Dashboard: Infra Redirect
 * Canonical alias for System Infrastructure Health.
 */
export default function AdminInfraRedirect() {
    redirect("/settings/system/operations");
}
