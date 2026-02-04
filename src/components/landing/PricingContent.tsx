"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PricingTable } from "@/components/landing/PricingTable";
import { Loader2 } from "lucide-react";

export function PricingContent() {
    const t = useTranslations('pricing');
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/pricing/plans")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setPlans(data.plans);
                }
            })
            .catch((err) => console.error("Error fetching plans:", err))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
            </div>
        );
    }

    return <PricingTable plans={plans} />;
}
