
import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ContentCard } from "@/components/ui/content-card";
import { Shield, Badge } from "lucide-react";
import { toast } from "sonner";
import { TenantConfig } from '@/lib/schemas';
import { useTranslations } from "next-intl";

interface SecurityCenterCardProps {
    config: TenantConfig | null;
}

export function SecurityCenterCard({ config }: SecurityCenterCardProps) {
    const t = useTranslations('admin.organizations.security');

    return (
        <ContentCard className="bg-muted flex items-center justify-between p-8" noPadding={true}>
            <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Shield size={28} />
                </div>
                <div>
                    <h4 className="font-bold text-foreground text-lg">{t('title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                </div>
            </div>
            <div className="flex gap-4">
                <Link href="/admin/audit">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground">{t('auditLink')}</Button>
                </Link>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
                            {t('certify')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-primary">
                                <Shield className="h-5 w-5" />
                                {t('certTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('certDesc', { organization: config?.name || t('orgDefault') })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border bg-muted p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{t('status.title')}</span>
                                    <span className="bg-emerald-100 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs rounded-full border font-semibold">{t('status.value')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{t('dataLocation.title')}</span>
                                    <span className="font-mono text-xs">{t('dataLocation.value')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{t('encryption.title')}</span>
                                    <span className="font-mono text-xs">{t('encryption.value')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{t('logRetention.title')}</span>
                                    <span className="font-mono text-xs">{t('logRetention.value')}</span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground bg-muted p-3 rounded border border-border">
                                <p>{t('gdprNote')}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => toast.success(t('downloadSuccess.title'), { description: t('downloadSuccess.desc') })}>
                                {t('downloadBtn')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ContentCard>
    );
}
