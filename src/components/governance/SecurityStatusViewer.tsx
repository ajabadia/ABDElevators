"use client";

import React from "react";
import { ContentCard } from "@/components/ui/content-card";
import { ShieldCheck, Lock, UserCheck, Smartphone } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

/**
 * 🔒 SecurityStatusViewer
 * Overview of the platform's security health.
 */
export function SecurityStatusViewer() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <MetricCard
                title="Guardian Integrity"
                value="Active"
                description="Era 12 ABAC Rules enforced"
                icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />}
                trend="100% Coverage"
                trendDirection="up"
            />
            <MetricCard
                title="MFA Adoption"
                value="85%"
                description="Compulsory for Admin roles"
                icon={<Smartphone className="h-4 w-4 text-blue-500" />}
                trend="+5% vs last month"
                trendDirection="up"
            />
            <MetricCard
                title="API Key Health"
                value="Secured"
                description="Hashed storage implemented"
                icon={<Lock className="h-4 w-4 text-amber-500" />}
            />
            <MetricCard
                title="Active Sessions"
                value="12"
                description="Cross-device monitoring"
                icon={<UserCheck className="h-4 w-4 text-purple-500" />}
            />
        </div>
    );
}
