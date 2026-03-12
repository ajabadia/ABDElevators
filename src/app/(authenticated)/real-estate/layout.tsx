import { isDemoMode } from "@/lib/demo-mode";
import { notFound } from "next/navigation";

/**
 * 🏢 Real Estate Hub Layout (Demo Fase 85)
 * Server Component to strictly enforce Demo Isolation.
 * If NEXT_PUBLIC_DEMO_MODE is not true, this whole segment returns 404,
 * effectively preventing client components below from bloating the production build.
 */
export default function RealEstateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Strict Server-Side Check for Demo Isolation
    if (!isDemoMode()) {
        notFound();
    }

    return (
        <div className="real-estate-demo-vertical">
            {children}
        </div>
    );
}
