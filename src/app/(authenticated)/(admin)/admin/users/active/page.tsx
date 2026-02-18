"use client";

import { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Shield, UserCog, KeyRound, Upload, Users } from "lucide-react";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { BulkInviteModal } from "@/components/admin/BulkInviteModal";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from "next-intl";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { DataTable, Column } from "@/components/ui/data-table";
import { useFormModal } from "@/hooks/useFormModal";
import { EntityEngine } from "@/core/engine/EntityEngine";
import { generateColumnsFromEntity } from "@/components/shared/DynamicTableUtils";
import { DynamicFormModal } from "@/components/shared/DynamicFormModal";
import { UserRole } from "@/types/roles";
import { Badge } from "@/components/ui/badge";

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    role: UserRole;
    tenantId?: string;
    isActive: boolean;
    createdAt: string;
    mfaEnabled?: boolean;
}

/**
 * 👥 Active Users Module
 * Management of active registered users.
 * UI Standardized with PageContainer/Header pattern.
 */
export default function UsersActivePage() {
    const t = useTranslations("admin.users");
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;
    const [isMounted, setIsMounted] = useState(false);

    // 0. Obtener definición de la entidad desde el "Cerebro"
    const entity = EntityEngine.getInstance().getEntity('usuario')!;

    // 1. Gestión de datos con hook genérico
    const { data: users, isLoading, refresh } = useApiList<User>({
        endpoint: entity.api.list,
        dataKey: 'users',
    });

    // 2. Mutaciones con hook genérico
    const { mutate: resetPassword } = useApiMutation<{ id: string, email: string }>({
        endpoint: (vars: any) => `/api/admin/users/${vars.id}/reset-password`,
        method: 'POST',
        confirmMessage: (vars: any) => `¿Resetear contraseña para ${vars.email}?`,
        successMessage: (res: any) => `Nueva contraseña temporal: ${res.tempPassword}`,
    });

    // 2. Modales con hook genérico
    const createModal = useFormModal();
    const inviteModal = useFormModal();
    const bulkInviteModal = useFormModal();
    const editModal = useFormModal<User>();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 3. Definición de columnas DINÁMICA + ACCIONES MANUALES
    const dynamicColumns = generateColumnsFromEntity<User>(entity);

    // Filtrar columnas sensibles o que requieren lógica especial
    const columns: Column<User>[] = [
        ...dynamicColumns.filter((c: any) => {
            if (c.accessorKey === 'tenantId' && !isSuperAdmin) return false;
            return true;
        }),
        {
            header: t("table.security"),
            accessorKey: "mfaEnabled",
            cell: (u: User) => (
                <div className="flex items-center gap-2">
                    {u.mfaEnabled ? (
                        <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <Shield className="w-3 h-3 mr-1" /> {t("table.mfa_active")}
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            <Shield className="w-3 h-3 mr-1" /> {t("table.no_mfa")}
                        </Badge>
                    )}
                </div>
            )
        },
        {
            header: t("table.actions"),
            cell: (u: User) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editModal.openEdit(u)}
                    >
                        <UserCog className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetPassword({ id: u._id, email: u.email })}
                    >
                        <KeyRound className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("registered_title")}
                subtitle={isSuperAdmin
                    ? t("registered_desc_global", { count: users?.length || 0, suffix: (users?.length || 0) !== 1 ? 's' : '' })
                    : t("registered_desc", { count: users?.length || 0, suffix: (users?.length || 0) !== 1 ? 's' : '' })}
                icon={<Users className="w-6 h-6 text-primary" />}
                backHref="/admin/users"
                actions={isMounted && (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => inviteModal.openCreate()}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            {t("invite")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => bulkInviteModal.openCreate()}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {t("bulk_invite")}
                        </Button>
                        <Button
                            onClick={() => createModal.openCreate()}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("create_manual")}
                        </Button>
                    </>
                )}
            />

            <ContentCard noPadding={true}>
                <CardHeader className="border-b border-border">
                    <CardTitle>{t("registered_title")}</CardTitle>
                    <CardDescription>
                        {isSuperAdmin
                            ? t("registered_desc_global", { count: users?.length || 0, suffix: (users?.length || 0) !== 1 ? 's' : '' })
                            : t("registered_desc", { count: users?.length || 0, suffix: (users?.length || 0) !== 1 ? 's' : '' })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={users || []}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage={t("empty_message")}
                    />
                </CardContent>
            </ContentCard>

            {/* CREACIÓN DINÁMICA (System Engine) */}
            <DynamicFormModal
                open={createModal.isOpen}
                entitySlug="user"
                mode="create"
                onClose={() => createModal.close()}
                onSuccess={() => {
                    refresh();
                    createModal.close();
                }}
            />

            {/* EDICIÓN DINÁMICA (System Engine) */}
            <DynamicFormModal
                open={editModal.isOpen}
                entitySlug="user"
                mode="edit"
                initialData={editModal.data}
                onClose={() => editModal.close()}
                onSuccess={() => {
                    refresh();
                    editModal.close();
                }}
            />

            <InviteUserModal
                open={inviteModal.isOpen}
                onClose={() => inviteModal.close()}
                onSuccess={() => {
                    refresh();
                    inviteModal.close();
                }}
            />

            <BulkInviteModal
                open={bulkInviteModal.isOpen}
                onClose={() => bulkInviteModal.close()}
                onSuccess={() => {
                    refresh();
                    bulkInviteModal.close();
                }}
            />
        </PageContainer>
    );
}
