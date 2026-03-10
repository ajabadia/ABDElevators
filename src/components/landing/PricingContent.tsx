"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PricingTable } from "@/components/landing/PricingTable";
import { Loader2 } from "lucide-react";
import { SupportErrorState } from "@/components/shared/SupportErrorState";
import { logEvento } from "@/lib/logger";

export function PricingContent() {
    const t = useTranslations('pricing');
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchPlans = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/pricing/plans");
            const data = await res.json();
            if (data.success) {
                setPlans(data.plans);
            } else {
                throw new Error(data.message || "Error al cargar los planes");
            }
        } catch (err: any) {
            setError(err);
            console.error("Error fetching plans:", err);
            logEvento({
                level: 'ERROR',
                source: 'PRICING_CONTENT',
                action: 'FETCH_PLANS',
                message: err.message,
                details: { error: err }
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    if (error) {
        return (
            <SupportErrorState
                error={error}
                reset={fetchPlans}
                context="Planes de Precios"
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
            </div>
        );
    }

    return <PricingTable plans={plans} />;
}
