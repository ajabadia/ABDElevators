import { auth, requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { redirect } from "next/navigation";

/**
 * 🛡️ Admin Group Layout (Guardian V3)
 * Enforces SUPER_ADMIN role for all routes within this group.
 */
export default async function AdminGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // 1. Basic auth check (already handled by middleware, but redundant at server-level is safer)
    if (!session) {
        redirect("/login");
    }

    // 2. Strict Role Check: Only SUPER_ADMIN allowed in this route group
    await requireRole([UserRole.SUPER_ADMIN]);

    return <>{children}</>;
}
