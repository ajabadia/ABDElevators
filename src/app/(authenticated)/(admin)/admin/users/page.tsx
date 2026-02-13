"use client";

import { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Shield, UserCog, KeyRound, Upload } from "lucide-react";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { BulkInviteModal } from "@/components/admin/BulkInviteModal";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitationsTable } from "@/components/admin/InvitationsTable";
import { Users, UserPlus } from "lucide-react";

// Nuevos componentes y hooks genéricos
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { DataTable, Column } from "@/components/ui/data-table";
import { useFormModal } from "@/hooks/useFormModal";
import { EntityEngine } from "@/core/engine/EntityEngine";
import { generateColumnsFromEntity } from "@/components/shared/DynamicTableUtils";
import { DynamicFormModal } from "@/components/shared/DynamicFormModal";
import { UserRole } from "@/types/roles";

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

export default function UsuariosPage() {
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
            accessorKey: "mfaEnabled", // Para sort
            cell: (u: User) => (
                <div className="flex items-center gap-2">
                    {u.mfaEnabled ? (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium border border-emerald-100">
                            <Shield className="w-3 h-3" /> {t("table.mfa_active")}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-full text-xs font-medium border border-slate-100">
                            <Shield className="w-3 h-3 grayscale opacity-50" /> {t("table.no_mfa")}
                        </div>
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
                        className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                    >
                        <UserCog className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetPassword({ id: u._id, email: u.email })}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <KeyRound className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                highlight={t("highlight")}
                subtitle={isSuperAdmin ? t("subtitle_global") : t("subtitle_org")}
                actions={isMounted && (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => inviteModal.openCreate()}
                            className="border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            {t("invite")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => bulkInviteModal.openCreate()}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {t("bulk_invite")}
                        </Button>
                        <Button
                            onClick={() => createModal.openCreate()}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("create_manual")}
                        </Button>
                    </>
                )}
            />

            <Tabs defaultValue="active" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-slate-100 p-1 rounded-lg">
                        <TabsTrigger value="active" className="flex items-center gap-2 px-6">
                            <Users className="w-4 h-4" />
                            {t("tabs.active")}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="flex items-center gap-2 px-6">
                            <UserPlus className="w-4 h-4" />
                            {t("tabs.pending")}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="active">
                    <ContentCard noPadding={true}>
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
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
                </TabsContent>

                <TabsContent value="pending">
                    <ContentCard noPadding={true}>
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                            <CardTitle>{t("invitations.title")}</CardTitle>
                            <CardDescription>{t("invitations.desc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <InvitationsTable />
                        </CardContent>
                    </ContentCard>
                </TabsContent>
            </Tabs>

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
