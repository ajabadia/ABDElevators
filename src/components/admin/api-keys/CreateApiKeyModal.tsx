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
    const [spaceId, setSpaceId] = useState<string | null>(null);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);


    // Get all available permissions from schema enum
    const availablePermissions = ApiKeyPermissionSchema.options;

    const handleCreate = async () => {
        if (!name) return toast.error(t('error_title'), { description: t('error_name') });
        if (permissions.length === 0) return toast.error(t('error_title'), { description: t('error_permissions') });

        setLoading(true);
        try {
            const result = await createApiKey(name, permissions, undefined, spaceId || undefined);
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

    const handleClose = () => {
        setOpen(false);
        setGeneratedKey(null);
        setName('');
        setPermissions([]);
        setSpaceId(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setOpen(true)}>
                    <Key className="w-4 h-4" />
                    {t('new_key')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t('subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {!generatedKey ? (
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('key_name_label')}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('key_name_placeholder')}
                                className="bg-slate-950 border-white/10"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="space">{t('space_restriction')}</Label>
                            <Select onValueChange={setSpaceId} value={spaceId || "none"}>
                                <SelectTrigger id="space" className="bg-slate-950 border-white/10">
                                    <SelectValue placeholder={t('select_space')} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="none">{t('global_space')}</SelectItem>
                                    {spaces.map(s => (
                                        <SelectItem key={s._id.toString()} value={s._id.toString()}>
                                            [{s.type}] {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-slate-400 italic">
                                {t('space_restriction_desc')}
                            </p>
                        </div>

                        <div className="grid gap-3">
                            <Label>{t('scopes')}</Label>
                            <div className="grid grid-cols-1 gap-2 border border-white/10 rounded-lg p-3 bg-slate-950/50">
                                {availablePermissions.map(perm => (
                                    <div key={perm} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={perm}
                                            checked={permissions.includes(perm)}
                                            onCheckedChange={() => togglePermission(perm)}
                                            className="border-white/20 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                        />
                                        <label
                                            htmlFor={perm}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300"
                                        >
                                            {perm}
                                        </label>
                                    </div>
                                ))}
                            </div>
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

                <DialogFooter>
                    {!generatedKey ? (
                        <Button onClick={handleCreate} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                            {loading ? "..." : t('new_key')}
                        </Button>
                    ) : (
                        <Button onClick={handleClose} variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                            {t('close_btn')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
