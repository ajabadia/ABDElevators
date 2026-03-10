import { requirePermission } from "@/lib/auth";
import GeneralClient from "./GeneralClient";

export default async function GeneralPage() {
    await requirePermission('admin:organization', 'manage');
    return <GeneralClient />;
}
