"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles"; // Ensure this enum exists and is correct
import TechnicianDashboard from "./roles/TechnicianDashboard";
import AdminDashboard from "./roles/AdminDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardDispatcher() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session?.user) {
        return null; // Or redirect to login
    }

    const role = session.user.role as UserRole;

    switch (role) {
        case UserRole.ADMIN:
        case UserRole.SUPER_ADMIN:
            return <AdminDashboard />;
        case UserRole.TECHNICAL:
        case UserRole.ENGINEERING:
        case UserRole.SUPPORT:
            return <TechnicianDashboard />;
        default:
            // Fallback for default users or other roles
            return <TechnicianDashboard />; // Or a generic UserDashboard
    }
}
