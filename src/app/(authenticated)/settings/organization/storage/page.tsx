import { requirePermission } from "@/lib/auth";
import StorageClient from "./StorageClient";

export default async function StoragePage() {
    await requirePermission('admin:storage', 'manage');
    return <StorageClient />;
}
