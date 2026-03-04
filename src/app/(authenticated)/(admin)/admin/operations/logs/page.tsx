import { redirect } from "next/navigation";

export default function OperationsLogsRedirect() {
    redirect("/admin/audit?tab=ops");
}
