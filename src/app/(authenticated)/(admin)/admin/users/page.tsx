"use client";

import { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, KeyRound, Mail, Plus } from "lucide-react";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

// Nuevos componentes y hooks genéricos
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useFormModal } from "@/hooks/useFormModal";
import { EntityEngine } from "@/core/engine/EntityEngine";
import { generateColumnsFromEntity } from "@/components/shared/DynamicTableUtils";
import { DynamicFormModal } from "@/components/shared/DynamicFormModal";

interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICAL' | 'ENGINEERING';
    tenantId?: string;
    isActive: boolean;
    createdAt: string;
}

export default function UsuariosPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
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
            header: "Acciones",
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
                title="Gestión de Usuarios"
                highlight="Usuarios"
                subtitle={`Administra usuarios y permisos ${isSuperAdmin ? 'globales' : 'de tu organización'}`}
                actions={isMounted && (
                    <>
                        <Button
                            variant="outline"
                            onClick={() => inviteModal.openCreate()}
                            className="border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Invitar Usuario
                        </Button>
                        <Button
                            onClick={() => createModal.openCreate()}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Manualmente
                        </Button>
                    </>
                )}
            />

            <ContentCard noPadding={true}>
                <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                    <CardTitle>Usuarios Registrados</CardTitle>
                    <CardDescription>
                        {users?.length || 0} usuario{(users?.length || 0) !== 1 ? 's' : ''} {isSuperAdmin ? 'accesibles' : 'en tu entidad'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={users || []}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage="No se encontraron usuarios registrados."
                    />
                </CardContent>
            </ContentCard>

            {/* CREACIÓN DINÁMICA (KIMI Engine) */}
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

            {/* EDICIÓN DINÁMICA (KIMI Engine) */}
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
        </PageContainer>
    );
}
