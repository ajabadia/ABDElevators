"use client";

import { useState, useEffect } from "react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Upload, UserPlus } from "lucide-react";
import { InviteUserModal } from "@/components/admin/InviteUserModal";
import { BulkInviteModal } from "@/components/admin/BulkInviteModal";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from "next-intl";
import { useFormModal } from "@/hooks/useFormModal";
import { InvitationsTable } from "@/components/admin/InvitationsTable";

export function InvitationsClient() {
    const t = useTranslations('admin_users');
    const [isMounted, setIsMounted] = useState(false);

    // Modales para invitaciones
    const inviteModal = useFormModal();
    const bulkInviteModal = useFormModal();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <PageContainer className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                title={t("invitations.title")}
                subtitle={t("invitations.desc")}
                icon={<UserPlus className="w-6 h-6 text-primary" />}
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
                    </>
                )}
            />

            <ContentCard noPadding={true}>
                <CardHeader className="border-b border-border">
                    <CardTitle>{t("invitations.title")}</CardTitle>
                    <CardDescription>{t("invitations.desc")}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <InvitationsTable />
                </CardContent>
            </ContentCard>

            <InviteUserModal
                open={inviteModal.isOpen}
                onClose={() => inviteModal.close()}
                onSuccess={() => {
                    // La tabla de invitaciones se refresca sola si usamos el patrón correcto,
                    // o podemos forzar un refresh si InvitationsTable lo expone.
                    // En este sistema, useApiList refresca automáticamente o al reenfocar.
                    inviteModal.close();
                }}
            />

            <BulkInviteModal
                open={bulkInviteModal.isOpen}
                onClose={() => bulkInviteModal.close()}
                onSuccess={() => {
                    bulkInviteModal.close();
                }}
            />
        </PageContainer>
    );
}
