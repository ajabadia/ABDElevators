import { redirect } from "next/navigation";

export default function SecurityAuditRedirect() {
    redirect("/admin/audit?tab=security");
}
