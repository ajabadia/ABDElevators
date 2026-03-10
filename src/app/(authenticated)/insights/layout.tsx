import { Suspense } from "react";
import { StatsSkeleton } from "@/components/shared/LoadingSkeleton";

export default function InsightsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<StatsSkeleton />}>
            {children}
        </Suspense>
    );
}
