"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Loader2, AlertTriangle } from "lucide-react";

interface Contract {
    tenantId: string;
    name: string;
    tier: string;
    limits: {
        tokens: number;
        storage: number;
        spaces_per_tenant: number;
        spaces_per_user: number;
    };
}

interface EditContractSheetProps {
    contract: Contract;
    isOpen: boolean;
    onClose: (shouldRefresh: boolean) => void;
}

export function EditContractSheet({ contract, isOpen, onClose }: EditContractSheetProps) {
    const t = useTranslations('admin.billing.contracts.edit');
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [tier, setTier] = useState(contract.tier);
    const [tokenLimit, setTokenLimit] = useState(contract.limits.tokens.toString());
    const [storageLimit, setStorageLimit] = useState(contract.limits.storage.toString());
    const [spacesTenantLimit, setSpacesTenantLimit] = useState(contract.limits.spaces_per_tenant.toString());
    const [spacesUserLimit, setSpacesUserLimit] = useState(contract.limits.spaces_per_user.toString());

    // Update state when contract prop changes
    useEffect(() => {
        setTier(contract.tier);
        setTokenLimit(contract.limits.tokens === Infinity ? "0" : contract.limits.tokens.toString());
        setStorageLimit(contract.limits.storage === Infinity ? "0" : contract.limits.storage.toString());
        setSpacesTenantLimit(contract.limits.spaces_per_tenant === Infinity ? "0" : contract.limits.spaces_per_tenant.toString());
        setSpacesUserLimit(contract.limits.spaces_per_user === Infinity ? "0" : contract.limits.spaces_per_user.toString());
    }, [contract]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const tokenLimitNum = parseInt(tokenLimit);
            const storageLimitNum = parseInt(storageLimit);
            const spacesTenantLimitNum = parseInt(spacesTenantLimit);
            const spacesUserLimitNum = parseInt(spacesUserLimit);

            const payload = {
                tenantId: contract.tenantId,
                tier: tier,
                customLimits: {
                    llm_tokens_per_month: tokenLimitNum === 0 ? undefined : tokenLimitNum,
                    storage_bytes: storageLimitNum === 0 ? undefined : storageLimitNum,
                    spaces_per_tenant: spacesTenantLimitNum === 0 ? undefined : spacesTenantLimitNum,
                    spaces_per_user: spacesUserLimitNum === 0 ? undefined : spacesUserLimitNum
                }
            };

            const response = await fetch('/api/admin/billing/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || t('error_updating'));
            }

            toast.success(t('success'), {
                description: t('success_desc', { name: contract.name }),
            });

            onClose(true); // Close and refresh
        } catch (error: any) {
            toast.error("Error", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
            <SheetContent className="sm:max-w-md overflow-y-auto animate-in slide-in-from-right duration-300">
                <SheetHeader>
                    <SheetTitle>{t('title')}</SheetTitle>
                    <SheetDescription>
                        {t('description', { name: contract.name, id: contract.tenantId })}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                    {/* Plan Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="plan-select" className="font-bold">{t('plan_label')}</Label>
                        <Select value={tier} onValueChange={setTier}>
                            <SelectTrigger id="plan-select" className="h-11 rounded-xl border-slate-200 dark:border-slate-800">
                                <SelectValue placeholder={t('plan_label')} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-slate-200 dark:border-slate-800">
                                <SelectItem value="FREE">{t('plans.free')}</SelectItem>
                                <SelectItem value="BASIC">{t('plans.basic')}</SelectItem>
                                <SelectItem value="PRO">{t('plans.pro')}</SelectItem>
                                <SelectItem value="ENTERPRISE">{t('plans.enterprise')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('plan_desc')}
                        </p>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Custom Limits */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-teal-500 rounded-full" aria-hidden="true" />
                            {t('overrides_title')}
                        </h4>

                        <div className="space-y-2">
                            <Label htmlFor="token-limit" className="font-medium text-xs">{t('tokens_label')}</Label>
                            <Input
                                id="token-limit"
                                type="number"
                                value={tokenLimit}
                                onChange={(e) => setTokenLimit(e.target.value)}
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                {t('tokens_desc')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storage-limit" className="font-medium text-xs">{t('storage_label')}</Label>
                            <Input
                                id="storage-limit"
                                type="number"
                                value={storageLimit}
                                onChange={(e) => setStorageLimit(e.target.value)}
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                {t('storage_desc')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="spaces-tenant-limit" className="font-medium text-xs font-bold">{t('spaces_tenant_label')}</Label>
                            <Input
                                id="spaces-tenant-limit"
                                type="number"
                                value={spacesTenantLimit}
                                onChange={(e) => setSpacesTenantLimit(e.target.value)}
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                {t('spaces_tenant_desc')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="spaces-user-limit" className="font-medium text-xs font-bold">{t('spaces_user_label')}</Label>
                            <Input
                                id="spaces-user-limit"
                                type="number"
                                value={spacesUserLimit}
                                onChange={(e) => setSpacesUserLimit(e.target.value)}
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                {t('spaces_user_desc')}
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" aria-hidden="true" />
                            <div>
                                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">{t('warning_title')}</h3>
                                <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                                    <p>{t('warning_desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <SheetFooter className="gap-3 sm:gap-0">
                    <Button variant="outline" onClick={() => onClose(false)} disabled={isLoading} className="rounded-xl h-11 border-slate-200 dark:border-slate-800 px-6 font-bold">
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-label="Guardando..." />
                        ) : null}
                        {t('save')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
