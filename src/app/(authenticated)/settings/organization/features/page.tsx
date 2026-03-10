import { requirePermission } from "@/lib/auth";
import FeaturesClient from "./FeaturesClient";

export default async function FeaturesPage() {
    await requirePermission('admin:features', 'read');
    return <FeaturesClient />;
}
