"use client";

import { ApiKey } from "@/lib/schemas";
import { Copy, Trash2, Key, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeApiKey } from "@/actions/api-keys";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface ApiKeyListProps {
    keys: ApiKey[];
}

export function ApiKeyList({ keys }: ApiKeyListProps) {
    const { toast } = useToast();

    if (keys.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                <Key className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300">No generated keys</h3>
                <p className="text-slate-500">Create a new key to start integrating via API.</p>
            </div>
        );
    }

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this key? Applications using it will stop working immediately.")) return;

        const res = await revokeApiKey(id);
        if (res.success) {
            toast({ title: "Revoked", description: "Key revoked successfully" });
        } else {
            toast({ title: "Error", description: res.error || "Failed to revoke", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            {keys.map((key) => (
                <div key={key._id} className={`p-4 rounded-xl border ${key.isActive ? 'border-white/10 bg-slate-900/50' : 'border-red-900/30 bg-red-950/10 opacity-60'} flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-white/20`}>
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
                            Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                        </div>
                        {key.lastUsedAt && (
                            <div className="text-teal-400">
                                Last used: {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}
                            </div>
                        )}
                    </div>

                    {key.isActive && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                                onClick={() => handleRevoke(key._id)}
                                title="Revoke Key"
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
