"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    Search,
    Activity,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    ExternalLink,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Tenant {
    tenantId: string;
    name: string;
    industry: string;
    tier: string;
    healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    creado: string;
}

interface TenantsManagementClientProps {
    initialTenants: Tenant[];
}

export function TenantsManagementClient({ initialTenants }: TenantsManagementClientProps) {
    const t = useTranslations('admin_analytics');
    const tSuper = useTranslations('admin_superadmin');
    const [search, setSearch] = useState("");

    const filteredTenants = initialTenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tenantId.toLowerCase().includes(search.toLowerCase())
    );

    const getHealthBadge = (status: string) => {
        switch (status) {
            case 'HEALTHY': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"><ShieldCheck size={12} /> {tSuper('gov.status.healthy')}</Badge>;
            case 'WARNING': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><ShieldAlert size={12} /> {tSuper('gov.status.warning')}</Badge>;
            case 'CRITICAL': return <Badge className="bg-rose-50 text-rose-700 border-rose-200 gap-1"><ShieldX size={12} /> {tSuper('gov.status.critical')}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const columns: Column<Tenant>[] = [
        {
            header: tSuper('usage.tenant') || 'Tenant',
            accessorKey: "name",
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{row.tenantId}</span>
                </div>
            )
        },
        {
            header: t('commandCenter.identity.industry_fallback') || 'Industry',
            accessorKey: "industry",
            cell: (row) => <Badge variant="outline" className="text-[10px] uppercase">{row.industry}</Badge>
        },
        {
            header: "Status",
            accessorKey: "healthStatus",
            cell: (row) => getHealthBadge(row.healthStatus)
        },
        {
            header: "Plan",
            accessorKey: "tier",
            cell: (row) => <Badge className="bg-blue-50 text-blue-700 border-none font-black">{row.tier || 'PRO'}</Badge>
        },
        {
            header: "Created",
            accessorKey: "creado",
            cell: (row) => <span className="text-xs text-slate-500">{new Date(row.creado).toLocaleDateString()}</span>
        },
        {
            header: "",
            accessorKey: "actions",
            cell: (row) => (
                <div className="flex justify-end">
                    <Link href={`/settings/organization?tenantId=${row.tenantId}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink size={14} />
                        </Button>
                    </Link>
                </div>
            )
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={tSuper('gov.health_grid_title') || 'Tenant Management'}
                subtitle="Global multi-tenant governance and administrative control center."
                icon={<Building2 className="text-primary" />}
                backHref="/admin-dashboard"
                actions={
                    <Button className="gap-2">
                        <Plus size={18} />
                        New Tenant
                    </Button>
                }
            />

            <ContentCard className="mt-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Search tenants..."
                            className="pl-10 h-11 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Activity size={16} className="text-teal-500 animate-pulse" />
                        Live Multi-tenant Feed
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredTenants}
                    isLoading={false}
                />
            </ContentCard>
        </PageContainer>
    );
}
