import { auth, requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { redirect } from "next/navigation";

export default async function SupportGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    await requireRole([UserRole.SUPPORT, UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    return <>{children}</>;
}
