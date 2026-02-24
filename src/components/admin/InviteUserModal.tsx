"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { useApiMutation } from "@/hooks/useApiMutation";
import { UserRole } from "@/types/roles";
import { useTranslations } from "next-intl";

interface InviteUserModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
    const t = useTranslations("admin.users.invite_modal");
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

    const [invited, setInvited] = useState(false);


    const [formData, setFormData] = useState({
        email: "",
        rol: UserRole.TECHNICAL as UserRole,
        tenantId: "",
    });

    const { mutate: inviteUser, isLoading: loading } = useApiMutation({
        endpoint: '/api/admin/usuarios/invite',
        method: 'POST',
        onSuccess: () => {
            setInvited(true);
            toast.success(t('success_title'), {
                description: `${t('success_description')} ${formData.email}`,
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        inviteUser(formData);
    };

    const handleClose = () => {
        if (invited) {
            onSuccess();
        }
        setFormData({
            email: "",
            rol: UserRole.TECHNICAL,
            tenantId: "",
        });
        setInvited(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px] border-teal-100">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-teal-600" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold text-slate-800">{t('title')}</DialogTitle>
                    <DialogDescription className="text-center text-slate-500">
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>

                {invited ? (
                    <div className="space-y-6 pt-4">
                        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-100 rounded-full mb-3">
                                <Mail className="h-5 w-5 text-teal-600" />
                            </div>
                            <h3 className="text-lg font-bold text-teal-900 mb-1">{t('success_title')}</h3>
                            <p className="text-sm text-teal-700">
                                {t('success_description')}<br />
                                <strong className="text-teal-900">{formData.email}</strong>
                            </p>
                            <p className="text-xs text-teal-600 mt-4 italic">
                                {t('success_validity')}
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full bg-teal-600 hover:bg-teal-700">
                            {t('understood')}
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-700 font-semibold">{t('email_label')}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('email_placeholder')}
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 border-slate-200 focus:ring-teal-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rol" className="text-slate-700 font-semibold">{t('role_label')}</Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                                <Select
                                    value={formData.rol}
                                    onValueChange={(value: any) => setFormData({ ...formData, rol: value })}
                                >
                                    <SelectTrigger className="pl-10 border-slate-200 focus:ring-teal-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isSuperAdmin && <SelectItem value={UserRole.SUPER_ADMIN}>{t('roles.super_admin')}</SelectItem>}
                                        <SelectItem value={UserRole.ADMIN}>{t('roles.admin')}</SelectItem>
                                        <SelectItem value={UserRole.TECHNICAL}>{t('roles.technical')}</SelectItem>
                                        <SelectItem value={UserRole.ENGINEERING}>{t('roles.engineering')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <Label htmlFor="tenantId" className="text-orange-600 font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    {t('tenant_label')}
                                </Label>
                                <Input
                                    id="tenantId"
                                    placeholder={t('tenant_placeholder')}
                                    required
                                    value={formData.tenantId}
                                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                    className="border-orange-200 focus:ring-orange-500 bg-orange-50/30"
                                />
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={handleClose} className="text-slate-500">
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 min-w-[140px] shadow-lg shadow-teal-600/20">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('sending')}
                                    </>
                                ) : (
                                    t('submit')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
