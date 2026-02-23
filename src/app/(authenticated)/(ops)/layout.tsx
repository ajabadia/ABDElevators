import { auth, requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { redirect } from "next/navigation";

/**
 * 🛡️ Ops Group Layout
 * Enforces SUPER_ADMIN role for Operations and Reporting features.
 */
export default async function OpsGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Strict Role Check: Only SUPER_ADMIN allowed in ops route group
    await requireRole([UserRole.SUPER_ADMIN]);

    return <>{children}</>;
}
