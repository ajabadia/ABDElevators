import { requirePermission } from "@/lib/auth";
import BrandingClient from "./BrandingClient";

export default async function BrandingPage() {
    await requirePermission('admin:branding', 'manage');
    return <BrandingClient />;
}
