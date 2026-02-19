"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles"; // Ensure this enum exists and is correct
import HubDashboard from "./HubDashboard";
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

    // Unified Hub Dashboard for all roles (filters internaly)
    return <HubDashboard />;
}
