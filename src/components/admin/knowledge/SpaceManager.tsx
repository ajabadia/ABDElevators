"use client";

import { useState } from "react";
import { useApiList } from "@/hooks/useApiList";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Globe, Building2, User, Users, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateSpaceModal } from "./CreateSpaceModal";
import { Space } from "@/lib/schemas/spaces";
import { format } from "date-fns";
import { SpaceManagementModal } from "./SpaceManagementModal";
import { useTranslations } from "next-intl";

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
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">/{item.slug}</span>
                </div>
            ),
        },
        {
            header: t("table.type"),
            cell: (item: Space) => {
                const type = item.type;
                const config: Record<string, any> = {
                    GLOBAL: { label: t("types.global"), icon: Globe, variant: "secondary" },
                    INDUSTRY: { label: t("types.industry"), icon: Box, variant: "outline" },
                    TENANT: { label: t("types.tenant"), icon: Building2, variant: "default" },
                    TEAM: { label: t("types.team"), icon: Users, variant: "secondary" },
                    PERSONAL: { label: t("types.personal"), icon: User, variant: "outline" },
                };
                const { label, icon: Icon, variant } = config[type] || config.TENANT;
                return (
                    <Badge variant={variant} className="flex items-center gap-1 h-5 text-[10px]">
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
                const variants: Record<string, any> = {
                    PUBLIC: "default",
                    INTERNAL: "secondary",
                    PRIVATE: "outline",
                    RESTRICTED: "destructive",
                };
                return (
                    <Badge variant={variants[visibility] || "secondary"} className="h-5 text-[10px]">
                        {visibility}
                    </Badge>
                );
            },
        },
        {
            header: t("table.status"),
            cell: (item: Space) => (
                <Badge variant={item.isActive ? "default" : "secondary"} className="h-5 text-[10px]">
                    {item.isActive ? t("status.active") : t("status.inactive")}
                </Badge>
            ),
        },
        {
            header: t("table.created"),
            cell: (item: Space) => item.createdAt ? (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}
                </span>
            ) : "-",
        },
        {
            header: t("table.actions"),
            cell: (item: Space) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => {
                        setSelectedSpace(item);
                        setIsManageModalOpen(true);
                    }}
                >
                    {t("manage")}
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        placeholder={t("search_placeholder")}
                        className="pl-8 h-9 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="h-9">
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    {t("new_space")}
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={items || []}
                isLoading={isLoading}
            />

            <CreateSpaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={refresh}
            />
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
        </div>
    );
}
