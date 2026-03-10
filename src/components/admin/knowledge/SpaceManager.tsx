"use client";

import { useState } from "react";
import { useApiList } from "@/hooks/useApiList";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Globe, Building2, User, Users, Box, FolderOpen, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateSpaceModal } from "./CreateSpaceModal";
import { Space } from "@/lib/schemas/spaces";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SpaceManagementModal } from "./SpaceManagementModal";
import { useTranslations } from "next-intl";

/**
 * 🚀 Space Manager (Refactored Phase 345)
 * Industrial-grade UI for managing knowledge contexts.
 */
export function SpaceManager() {
    const t = useTranslations("common.spaces.admin");
    const [search, setSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const { data: items, isLoading, refresh } = useApiList<Space>({
        endpoint: "/api/admin/spaces",
        filters: { search },
        dataKey: "items",
    });

    const columns: Column<Space>[] = [
        {
            header: t("table.space"),
            cell: (item: Space) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 shadow-sm">
                        <FolderOpen size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm tracking-tight">{item.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">/{item.slug}</span>
                    </div>
                </div>
            ),
        },
        {
            header: t("table.type"),
            cell: (item: Space) => {
                const type = item.type;
                const config: Record<string, any> = {
                    GLOBAL: { label: t("types.global"), icon: Globe, className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900" },
                    INDUSTRY: { label: t("types.industry"), icon: Box, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900" },
                    TENANT: { label: t("types.tenant"), icon: Building2, className: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900" },
                    TEAM: { label: t("types.team"), icon: Users, className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900" },
                    PERSONAL: { label: t("types.personal"), icon: User, className: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900" },
                };
                const { label, icon: Icon, className } = config[type] || config.TENANT;
                return (
                    <Badge variant="outline" className={`flex items-center gap-1.5 h-6 text-[10px] font-black uppercase tracking-tighter ${className}`}>
                        <Icon className="w-3 h-3" aria-hidden="true" />
                        {label}
                    </Badge>
                );
            },
        },
        {
            header: t("table.visibility"),
            cell: (item: Space) => {
                const visibility = item.visibility;
                const config: Record<string, any> = {
                    PUBLIC: { label: t("visibility.PUBLIC"), className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400" },
                    INTERNAL: { label: t("visibility.INTERNAL"), className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400" },
                    PRIVATE: { label: t("visibility.PRIVATE"), className: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400" },
                    RESTRICTED: { label: t("visibility.RESTRICTED"), className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400" },
                };
                const { label, className } = config[visibility] || { label: visibility, className: "" };
                return (
                    <Badge variant="outline" className={`h-6 text-[10px] whitespace-nowrap font-bold ${className}`}>
                        {label}
                    </Badge>
                );
            },
        },
        {
            header: t("table.status"),
            cell: (item: Space) => (
                <Badge variant={item.isActive ? "default" : "secondary"} className="h-6 text-[10px] font-bold uppercase">
                    {item.isActive ? t("status.active") : t("status.inactive")}
                </Badge>
            ),
        },
        {
            header: t("table.created"),
            cell: (item: Space) => item.createdAt ? (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                    {format(new Date(item.createdAt), "dd MMM yyyy", { locale: es })}
                </span>
            ) : "-",
        },
        {
            header: t("table.actions"),
            cell: (item: Space) => (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] px-3 font-bold uppercase tracking-widest rounded-lg border-border hover:bg-muted"
                    onClick={() => {
                        setSelectedSpace(item);
                        setIsManageModalOpen(true);
                    }}
                    aria-label={`${t("manage")} ${item.name}`}
                >
                    <Settings className="w-3 h-3 mr-1.5" />
                    {t("manage")}
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" aria-hidden="true" />
                    <Input
                        placeholder={t("search_placeholder")}
                        className="pl-10 h-10 text-sm rounded-xl border-border bg-card/50 focus:bg-card transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="h-10 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-teal-900/10 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t("new_space")}
                </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <DataTable
                    columns={columns}
                    data={items || []}
                    isLoading={isLoading}
                />
            </div>

            <CreateSpaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={refresh}
            />

            {selectedSpace && (
                <SpaceManagementModal
                    space={selectedSpace}
                    isOpen={isManageModalOpen}
                    onClose={() => {
                        setIsManageModalOpen(false);
                        setSelectedSpace(null);
                    }}
                    onSuccess={() => {
                        refresh();
                        setIsManageModalOpen(false);
                        setSelectedSpace(null);
                    }}
                />
            )}
        </div>
    );
}
