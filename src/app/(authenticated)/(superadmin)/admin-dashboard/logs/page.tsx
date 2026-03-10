import { redirect } from "next/navigation";

/**
 * 📜 Admin Dashboard: Logs Redirect
 * Canonical alias for Global System Logs.
 */
export default function AdminLogsRedirect() {
    redirect("/insights/audit?tab=ops");
}
