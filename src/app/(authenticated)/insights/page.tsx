"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, ShieldCheck, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const INSIGHTS_MODULES = [
    {
        id: "analytics",
        titleKey: "insights.analytics.title",
        descKey: "insights.analytics.description",
        icon: BarChart3,
        href: "/insights/analytics",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        id: "reports",
        titleKey: "insights.reports.title",
        descKey: "insights.reports.description",
        icon: FileText,
        href: "/insights/reports",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        id: "scheduled",
        titleKey: "insights.scheduled.title",
        descKey: "insights.scheduled.description",
        icon: Clock,
        href: "/insights/scheduled",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    {
        id: "audit",
        titleKey: "insights.audit.title",
        descKey: "insights.audit.description",
        icon: ShieldCheck,
        href: "/insights/audit",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        id: "compliance",
        titleKey: "insights.compliance.title",
        descKey: "insights.compliance.description",
        icon: ClipboardList,
        href: "/insights/compliance",
        color: "text-rose-500",
        bg: "bg-rose-500/10",
    },
];

export default function InsightsHub() {
    const t = useTranslations();

    // Helper for safe translations with fallbacks
    const safeT = (key: string, fallback: string) => {
        try {
            const res = t(key);
            return res === key ? fallback : res;
        } catch {
            return fallback;
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    {safeT("insights.hub.title", "Business Intelligence")}
                </h1>
                <p className="text-muted-foreground text-lg italic max-w-2xl">
                    {safeT("insights.hub.subtitle", "Analyze performance, access audit logs, and generate detailed reports for your organization.")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INSIGHTS_MODULES.map((module) => (
                    <Link key={module.id} href={module.href}>
                        <Card className="h-full border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer bg-card/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={`${module.bg} p-3 rounded-xl transition-transform group-hover:scale-105 duration-300 border border-current/10 shadow-sm`}>
                                    <module.icon className={`h-6 w-6 ${module.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {safeT(module.titleKey, module.id.charAt(0).toUpperCase() + module.id.slice(1))}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm leading-relaxed text-muted-foreground/80">
                                    {safeT(module.descKey, "Access and manage your business " + module.id + " data.")}
                                </CardDescription>
                                <div className="mt-4 flex items-center text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Explore Module →
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Stats Quick View Placeholder */}
            <div className="pt-8 border-t border-primary/10">
                <Card className="bg-primary/5 border-dashed border-primary/20">
                    <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-10 w-10 rounded-xl border-2 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-muted-foreground italic">
                            Loading cross-module insights...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
