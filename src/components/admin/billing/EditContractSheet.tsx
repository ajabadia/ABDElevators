
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
import { useToast } from "@/hooks/use-toast"; // Assuming hook exists

import { Loader2, AlertTriangle } from "lucide-react";

interface Contract {
    tenantId: string;
    name: string;
    tier: string;
    limits: {
        tokens: number;
        storage: number;
    };
}

interface EditContractSheetProps {
    contract: Contract;
    isOpen: boolean;
    onClose: (shouldRefresh: boolean) => void;
}

export function EditContractSheet({ contract, isOpen, onClose }: EditContractSheetProps) {
    const t = useTranslations('admin.billing.contracts.edit');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [tier, setTier] = useState(contract.tier);
    const [tokenLimit, setTokenLimit] = useState(contract.limits.tokens.toString());
    const [storageLimit, setStorageLimit] = useState(contract.limits.storage.toString());

    // Update state when contract prop changes
    useEffect(() => {
        setTier(contract.tier);
        setTokenLimit(contract.limits.tokens === Infinity ? "0" : contract.limits.tokens.toString());
        setStorageLimit(contract.limits.storage === Infinity ? "0" : contract.limits.storage.toString());
    }, [contract]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const tokenLimitNum = parseInt(tokenLimit);
            const storageLimitNum = parseInt(storageLimit);

            const payload = {
                tenantId: contract.tenantId,
                tier: tier,
                customLimits: {
                    llm_tokens_per_month: tokenLimitNum === 0 ? undefined : tokenLimitNum,
                    storage_bytes: storageLimitNum === 0 ? undefined : storageLimitNum
                }
            };

            const response = await fetch('/api/admin/billing/contracts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error updating contract");
            }

            toast({
                title: t('success'),
                description: t('success_desc', { name: contract.name }),
            });

            onClose(true); // Close and refresh
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t('title')}</SheetTitle>
                    <SheetDescription>
                        {t('description', { name: contract.name, id: contract.tenantId })}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-6">
                    {/* Plan Selection */}
                    <div className="space-y-2">
                        <Label>{t('plan_label')}</Label>
                        <Select value={tier} onValueChange={setTier}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FREE">Free Trial</SelectItem>
                                <SelectItem value="BASIC">Basic Business</SelectItem>
                                <SelectItem value="PRO">Professional</SelectItem>
                                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('plan_desc')}
                        </p>
                    </div>

                    <Separator />

                    {/* Custom Limits */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm">{t('overrides_title')}</h4>

                        <div className="space-y-2">
                            <Label>{t('tokens_label')}</Label>
                            <Input
                                type="number"
                                value={tokenLimit}
                                onChange={(e) => setTokenLimit(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('tokens_desc')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('storage_label')}</Label>
                            <Input
                                type="number"
                                value={storageLimit}
                                onChange={(e) => setStorageLimit(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('storage_desc')}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/10">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">{t('warning_title')}</h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                    <p>{t('warning_desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <SheetFooter>
                    <Button variant="outline" onClick={() => onClose(false)} disabled={isLoading}>{t('cancel')}</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
