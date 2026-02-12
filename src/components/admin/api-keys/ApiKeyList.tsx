"use client";

import { ApiKey } from "@/lib/schemas";
import { Trash2, Key, Calendar, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeApiKey } from "@/actions/api-keys";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useFormatter } from 'next-intl';

interface ApiKeyListProps {
    keys: ApiKey[];
}

export function ApiKeyList({ keys }: ApiKeyListProps) {
    const { toast } = useToast();
    const t = useTranslations('admin.api_keys');
    const format = useFormatter();

    if (keys.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                    <Key className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">{t('no_keys')}</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    {t('no_keys_desc')}
                </p>
            </div>
        );
    }

    const handleRevoke = async (id: string, name: string) => {
        if (!confirm(t('revoke_confirm'))) return;

        const res = await revokeApiKey(id);
        if (res.success) {
            toast({
                title: t('revoke_success'),
                description: `${name} has been deactivated.`
            });
        } else {
            toast({
                title: "Error",
                description: res.error || "Failed to revoke",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-4">
            {keys.map((key) => (
                <div key={key._id} className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${key.isActive ? 'border-slate-800 bg-slate-900/50 hover:border-teal-900/50' : 'border-red-900/20 bg-red-950/5 opacity-70'}`}>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-white">{key.name}</h4>
                            {!key.isActive && <Badge variant="destructive" className="text-[10px]">REVOKED</Badge>}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded w-fit">
                            <span>{key.keyPrefix}</span>
                            <span className="text-slate-600">••••••••••••••••</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {key.spaceId && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800 flex items-center gap-1 font-bold">
                                    <LayoutGrid size={10} />
                                    SPACE: {key.spaceId}
                                </span>
                            )}
                            {key.permissions.map(p => (
                                <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/30 text-teal-300 border border-teal-800">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t('created', {
                                distance: format.relativeTime(new Date(key.createdAt))
                            })}
                        </div>
                        {key.lastUsedAt && (
                            <div className="text-teal-400">
                                {t('last_used', {
                                    distance: format.relativeTime(new Date(key.lastUsedAt))
                                })}
                            </div>
                        )}
                    </div>

                    {key.isActive && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                onClick={() => handleRevoke(key._id, key.name)}
                                title={t('revoke_btn')}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
