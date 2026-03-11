"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createApiKey } from '@/actions/api-keys';
import { ApiKeyPermission, ApiKeyPermissionSchema } from '@/lib/schemas';
import { toast } from "sonner";
import { Copy, Key, AlertTriangle } from 'lucide-react';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslations } from 'next-intl';

export function CreateApiKeyModal({ spaces = [] }: { spaces?: any[] }) {
    const t = useTranslations('admin.api_keys');
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<ApiKeyPermission[]>([]);
    const [spaceIds, setSpaceIds] = useState<string[]>([]);
    const [allowedIps, setAllowedIps] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Get all available permissions from schema enum
    const availablePermissions = ApiKeyPermissionSchema.options;

    const handleCreate = async () => {
        if (!name) return toast.error(t('error_title'), { description: t('error_name') });
        if (permissions.length === 0) return toast.error(t('error_title'), { description: t('error_permissions') });

        setLoading(true);
        try {
            const scopes = {
                spaceIds: spaceIds.length > 0 ? spaceIds : undefined,
                allowedIps: allowedIps ? allowedIps.split(',').map(ip => ip.trim()) : undefined
            };

            const result = await createApiKey(name, permissions, undefined, scopes);
            if (result.success && result.data) {
                setGeneratedKey(result.data.plainTextKey);
                toast.success(t('copied'), { description: t('create_success') });
            } else {
                toast.error(t('error_title'), { description: result.error || t('unknown_error') });
            }
        } catch (e) {
            toast.error(t('error_title'), { description: t('error_creating') });
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (perm: ApiKeyPermission) => {
        setPermissions(current =>
            current.includes(perm)
                ? current.filter(p => p !== perm)
                : [...current, perm]
        );
    };

    const toggleSpace = (id: string) => {
        setSpaceIds(current =>
            current.includes(id)
                ? current.filter(s => s !== id)
                : [...current, id]
        );
    };

    const handleClose = () => {
        setOpen(false);
        setGeneratedKey(null);
        setName('');
        setPermissions([]);
        setSpaceIds([]);
        setAllowedIps('');
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setOpen(true)}>
                    <Key className="w-4 h-4" />
                    {t('new_key')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-950 border-white/5 text-white p-0 overflow-hidden rounded-3xl">
                <div className="p-6 bg-slate-900 border-b border-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter">{t('title')}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs uppercase font-bold tracking-widest">
                            Era 12 / Security Standard
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {!generatedKey ? (
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-500">{t('key_name_label')}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('key_name_placeholder')}
                                className="bg-slate-950 border-white/10 rounded-xl h-12 focus:ring-teal-500/20"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-500">{t('scopes')}</Label>
                            <div className="grid grid-cols-1 gap-2 border border-white/5 rounded-2xl p-4 bg-slate-950/50">
                                {availablePermissions.map(perm => (
                                    <div key={perm} className="flex items-center space-x-3 group cursor-pointer" onClick={() => togglePermission(perm)}>
                                        <Checkbox
                                            id={perm}
                                            checked={permissions.includes(perm)}
                                            onCheckedChange={() => togglePermission(perm)}
                                            className="border-white/20 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 rounded-md"
                                        />
                                        <label
                                            htmlFor={perm}
                                            className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors cursor-pointer"
                                        >
                                            {perm}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Restricción de Espacios</Label>
                            <div className="grid grid-cols-1 gap-2 border border-white/5 rounded-2xl p-4 bg-slate-950/50 max-h-[150px] overflow-y-auto">
                                {spaces.length === 0 ? (
                                    <p className="text-xs text-slate-600 italic text-center py-2">No hay espacios disponibles</p>
                                ) : (
                                    spaces.map(s => (
                                        <div key={s._id.toString()} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleSpace(s._id.toString())}>
                                            <Checkbox
                                                id={`space-${s._id}`}
                                                checked={spaceIds.includes(s._id.toString())}
                                                onCheckedChange={() => toggleSpace(s._id.toString())}
                                                className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-md"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                                                    {s.name}
                                                </span>
                                                <span className="text-[9px] text-slate-600 font-mono italic">[{s.type || 'DEFAULT'}]</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic px-1">
                                Si no seleccionas ninguno, la clave tendrá acceso a todos los espacios (Global).
                            </p>
                        </div>

                        <div className="space-y-2 pb-2">
                            <Label htmlFor="ips" className="text-[10px] font-black uppercase text-slate-500">Restricción de IP (Whitelisting)</Label>
                            <Input
                                id="ips"
                                value={allowedIps}
                                onChange={(e) => setAllowedIps(e.target.value)}
                                placeholder="192.168.1.1, 10.0.0.0/24"
                                className="bg-slate-950 border-white/10 rounded-xl h-12 focus:ring-teal-500/20"
                            />
                            <p className="text-[9px] text-slate-600 font-medium px-1">
                                Separa múltiples IPs o CIDRs con comas. Deja vacío para acceso ilimitado.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-200">
                            <AlertTriangle className="h-4 w-4 stroke-amber-500" />
                            <AlertTitle>{t('save_warning')}</AlertTitle>
                            <AlertDescription>
                                {t('save_warning_desc')}
                            </AlertDescription>
                        </Alert>

                        <div className="relative">
                            <div className="p-4 bg-black rounded-lg border border-teal-500/30 font-mono text-teal-400 break-all text-sm shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                                {generatedKey}
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedKey);
                                    toast.success(t('copied'), { description: t('copy_toast') });
                                }}
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-6 bg-slate-950/50 border-t border-white/5">
                    <DialogFooter>
                        {!generatedKey ? (
                            <Button onClick={handleCreate} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-widest h-12 rounded-2xl shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                                {loading ? "..." : t('new_key')}
                            </Button>
                        ) : (
                            <Button onClick={handleClose} variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white h-12 rounded-2xl font-bold uppercase tracking-widest">
                                {t('close_btn')}
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
