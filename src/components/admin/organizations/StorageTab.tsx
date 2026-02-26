
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Server, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantConfig } from '@/lib/schemas';
import { useTranslations } from "next-intl";

interface StorageTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
    usageStats: any;
}

export function StorageTab({ config, setConfig, usageStats }: StorageTabProps) {
    const t = useTranslations('admin.organizations.storage');
    const tQuota = useTranslations('admin.organizations.storage.quota');
    const tUsage = useTranslations('admin.organizations.storageUsage');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
                <Label className="text-foreground font-semibold">{t('provider')}</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => setConfig(prev => prev ? { ...prev, storage: { ...prev.storage, provider: 'cloudinary' } } : null)}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${config?.storage?.provider === 'cloudinary' ? 'border-primary bg-primary/5' : 'border-muted hover:border-border'}`}
                    >
                        <Cloud className={config?.storage?.provider === 'cloudinary' ? 'text-primary' : 'text-muted-foreground'} size={24} aria-hidden="true" />
                        <h4 className="font-bold mt-2">{t('cloudinary')}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('cloudinaryDesc')}</p>
                    </div>
                    <div className="p-6 rounded-2xl border-2 border-muted opacity-50 cursor-not-allowed bg-muted/50 relative overflow-hidden group">
                        <Server className="text-muted-foreground" size={24} aria-hidden="true" />
                        <h4 className="font-bold mt-2 text-muted-foreground">{t('awsS3')}</h4>
                        <div className="absolute top-2 right-2 rotate-12 bg-muted text-muted-foreground text-[8px] px-2 py-0.5 rounded-full font-bold">{t('comingSoon')}</div>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <Label htmlFor="folder_prefix">{t('folderPrefix')}</Label>
                    <Input
                        id="folder_prefix"
                        value={config?.storage?.settings?.folder_prefix || ''}
                        onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            storage: {
                                ...prev.storage,
                                settings: { ...(prev.storage?.settings || {}), folder_prefix: e.target.value }
                            }
                        } : null)}
                        className="font-mono text-xs bg-muted"
                    />
                    <p className="text-[10px] text-muted-foreground">{t('folderPrefixDesc')}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-6 rounded-2xl border bg-muted/30 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <Label className="text-foreground font-semibold">{tQuota('title')}</Label>
                            <p className="text-xs text-muted-foreground">{tQuota('desc')}</p>
                        </div>
                        <span className="text-3xl font-bold font-outfit text-primary">
                            {config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0} {tUsage('mb')}
                        </span>
                    </div>
                    <Input
                        type="number"
                        value={config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0}
                        onChange={(e) => {
                            const mb = parseInt(e.target.value) || 0;
                            setConfig(prev => prev ? {
                                ...prev,
                                storage: {
                                    ...prev.storage,
                                    quota_bytes: mb * 1024 * 1024
                                }
                            } : null);
                        }}
                        className="text-lg font-bold"
                    />

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-end text-xs">
                            <span className="text-muted-foreground font-medium">{tQuota('currentUsage')}</span>
                            <span className="font-bold text-foreground">
                                {usageStats?.storage ? Math.round(usageStats.storage / (1024 * 1024)) : 0} {tUsage('mb')} / {config?.storage?.quota_bytes ? Math.round(config.storage.quota_bytes / (1024 * 1024)) : 0} {tUsage('mb')}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000",
                                    (usageStats?.storage / (config?.storage?.quota_bytes || 1)) > 0.9 ? "bg-destructive" :
                                        (usageStats?.storage / (config?.storage?.quota_bytes || 1)) > 0.7 ? "bg-amber-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(100, Math.round((usageStats?.storage || 0) / (config?.storage?.quota_bytes || 1) * 100))}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground italic">{tUsage('metric')}</span>
                            <span className={cn(
                                "font-bold",
                                (usageStats?.storage / (config?.storage?.quota_bytes || 1)) > 0.9 ? "text-destructive" : "text-muted-foreground"
                            )}>
                                {Math.round((usageStats?.storage || 0) / (config?.storage?.quota_bytes || 1) * 100)}% {tUsage('used')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900">
                        <AlertCircle size={16} aria-hidden="true" />
                        <span className="text-[10px]">{tQuota('warning')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
