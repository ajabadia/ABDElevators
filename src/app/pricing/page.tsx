"use client";

import { useEffect, useState } from "react";
import { PricingTable } from "@/components/landing/PricingTable";
import { FAQSection } from "@/components/landing/FAQSection";
import { Loader2 } from "lucide-react";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function PricingPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const res = await fetch('/api/pricing/plans');
                const data = await res.json();
                if (data.success) {
                    setPlans(data.plans);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPlans();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium font-outfit uppercase tracking-widest text-[10px]">Cargando Planes...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            <main className="pt-20">
                <PricingTable plans={plans} />
                <FAQSection />
            </main>

            <PublicFooter />
        </div>
    );
}
