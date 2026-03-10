import { Suspense } from "react";
import { TicketListSkeleton } from "@/components/shared/LoadingSkeleton";

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<TicketListSkeleton />}>
            {children}
        </Suspense>
    );
}
