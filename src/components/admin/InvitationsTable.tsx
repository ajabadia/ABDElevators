"use client";

import { useTranslations } from "next-intl";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Send, Mail, Clock, Shield } from "lucide-react";
import { formatRelative } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface Invitation {
    _id: string;
    email: string;
    role: string;
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
    expiresAt: string;
    createdAt: string;
    token: string;
}

export function InvitationsTable() {
    const t = useTranslations("admin.users.invitations");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const { data: invitations, isLoading, refresh } = useApiList<Invitation>({
        endpoint: "/api/admin/users/invite",
        dataKey: "invitations",
    });

    const { mutate: revoke, isLoading: isRevoking } = useApiMutation({
        endpoint: "/api/admin/users/invite/revoke",
        method: "POST",
        confirmMessage: (vars: any) => t("revoke_confirm", { email: vars.email }),
        onSuccess: () => refresh(),
    });

    const columns: Column<Invitation>[] = [
        {
            header: t("table.email"),
            accessorKey: "email",
            cell: (inv) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{inv.email}</span>
                </div>
            )
        },
        {
            header: t("table.role"),
            accessorKey: "role",
            cell: (inv) => (
                <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-teal-600" />
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                        {inv.role}
                    </Badge>
                </div>
            )
        },
        {
            header: t("table.status"),
            accessorKey: "status",
            cell: (inv) => {
                const colors = {
                    PENDING: "bg-blue-50 text-blue-700 border-blue-100",
                    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    EXPIRED: "bg-amber-50 text-amber-700 border-amber-100",
                    REVOKED: "bg-slate-50 text-slate-700 border-slate-100",
                };
                return (
                    <Badge className={`${colors[inv.status]} border font-medium shadow-none`}>
                        {t(`status.${inv.status.toLowerCase()}`)}
                    </Badge>
                );
            }
        },
        {
            header: t("table.expiry"),
            accessorKey: "expiresAt",
            cell: (inv) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatRelative(new Date(inv.expiresAt), new Date(), { locale: dateLocale })}
                </div>
            )
        },
        {
            header: tCommon("actions_label"),
            cell: (inv) => (
                <div className="flex items-center gap-1">
                    {inv.status === 'PENDING' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revoke({ token: inv.token, email: inv.email })}
                                disabled={isRevoking}
                                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <DataTable
            data={invitations || []}
            columns={columns}
            isLoading={isLoading}
            emptyMessage={t("empty")}
        />
    );
}
