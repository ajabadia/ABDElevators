import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";

export default async function RagQualityPage() {
    const session = await auth();

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        redirect("/pedidos");
    }

    return (
        <div className="flex-1">
            <RagQualityDashboard />
        </div>
    );
}
