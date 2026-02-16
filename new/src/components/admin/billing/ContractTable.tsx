"use client";

import { useState, useEffect } from "react";
import { useApiList } from "@/hooks/useApiList";
import { useTranslations, useFormatter } from "next-intl";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Search,
    Edit,
    FileText,
    Shield,
    Loader2
} from "lucide-react";
import { EditContractSheet } from "./EditContractSheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Contract {
    tenantId: string;
    name: string;
    tier: string;
    planName: string;
    status: string;
    customOverrides: boolean;
    usage: {
        tokens: number;
        storage: number;
        spaces_per_tenant: number;
    };
    limits: {
        tokens: number;
        storage: number;
        spaces_per_tenant: number;
        spaces_per_user: number;
    };
    mrr: number;
    nextBillingDate: string;
}

export function ContractTable() {
    const [search, setSearch] = useState("");
    const [page] = useState(1);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const t = useTranslations('admin.billing.contracts');
    const format = useFormatter();
    const { toast } = useToast();

    const { data: contracts, isLoading, refresh, error } = useApiList<Contract>({
        endpoint: '/api/admin/billing/contracts',
        filters: { page, limit: 10, search },
        dataKey: 'contracts',
        debounceMs: 500
    });

    useEffect(() => {
        if (error) {
            toast({
                title: "Error",
                description: t('table.loading_error') || "Could not load contracts",
                variant: "destructive"
            });
        }
    }, [error, toast, t]);

    const handleEditClick = (contract: Contract) => {
        setSelectedContract(contract);
        setIsSheetOpen(true);
    };

    const handleSheetClose = (shouldRefresh: boolean) => {
        setIsSheetOpen(false);
        setSelectedContract(null);
        if (shouldRefresh) {
            refresh();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case 'PAST_DUE': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case 'BLOCKED': return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        type="search"
                        role="searchbox"
                        placeholder={t('table.search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 bg-background rounded-lg border-slate-200 dark:border-slate-800"
                        aria-label={t('table.search_placeholder')}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                            <TableHead className="font-bold">{t('table.tenant')}</TableHead>
                            <TableHead className="font-bold">{t('table.plan')}</TableHead>
                            <TableHead className="font-bold">{t('table.override')}</TableHead>
                            <TableHead className="font-bold">{t('table.usage')}</TableHead>
                            <TableHead className="font-bold">{t('table.mrr')}</TableHead>
                            <TableHead className="font-bold">{t('table.status')}</TableHead>
                            <TableHead className="text-right font-bold">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && contracts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
                                        <p className="text-sm text-muted-foreground font-medium animate-pulse">{t('table.loading')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && contracts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-50">
                                        <Shield className="w-12 h-12" aria-hidden="true" />
                                        <p className="font-medium">{t('table.empty')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {contracts.map((contract: Contract) => (
                            <TableRow key={contract.tenantId} className="border-slate-100 dark:border-slate-800 group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                <TableCell className="font-medium py-4">
                                    <div className="flex flex-col">
                                        <span className="text-slate-900 dark:text-slate-100 font-bold">{contract.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{contract.tenantId}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-bold tracking-tight">{contract.tier}</Badge>
                                </TableCell>
                                <TableCell>
                                    {contract.customOverrides ? (
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200/50 font-bold text-[10px]">
                                            {t('table.custom_badge')}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs font-medium">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1.5 text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-muted-foreground font-medium">Tokens:</span>
                                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/50">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-500"
                                                    style={{ width: `${Math.min((contract.usage.tokens / contract.limits.tokens) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-mono">
                                                {format.number(contract.usage.tokens, { notation: "compact" })} /
                                                {contract.limits.tokens === Infinity ? t('table.unlimited') : format.number(contract.limits.tokens, { notation: "compact" })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-muted-foreground font-medium">Store:</span>
                                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/50">
                                                <div
                                                    className="h-full bg-orange-500 transition-all duration-500"
                                                    style={{ width: `${Math.min((contract.usage.storage / contract.limits.storage) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-mono">
                                                {format.number(contract.usage.storage, { style: 'unit', unit: 'byte', unitDisplay: 'narrow', notation: 'compact' })} /
                                                {contract.limits.storage === Infinity ? t('table.unlimited') : format.number(contract.limits.storage, { style: 'unit', unit: 'byte', unitDisplay: 'narrow', notation: 'compact' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-muted-foreground font-medium">Spaces:</span>
                                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/50">
                                                <div
                                                    className="h-full bg-teal-500 transition-all duration-500"
                                                    style={{ width: `${Math.min((contract.usage.spaces_per_tenant / contract.limits.spaces_per_tenant) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-mono">
                                                {format.number(contract.usage.spaces_per_tenant, { notation: 'compact' })} /
                                                {contract.limits.spaces_per_tenant === Infinity ? t('table.unlimited') : format.number(contract.limits.spaces_per_tenant, { notation: 'compact' })}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {format.number(contract.mrr, { style: 'currency', currency: 'EUR' })}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("border-0 font-bold text-[10px]", getStatusColor(contract.status))}>
                                        {t(`status.${contract.status.toLowerCase() as 'active' | 'past_due' | 'blocked'}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label={t('table.open_menu')}>
                                                <span className="sr-only">{t('table.open_menu')}</span>
                                                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 shadow-lg border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-100">
                                            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditClick(contract)} className="gap-2 cursor-pointer">
                                                <Edit className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                                {t('actions.edit')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toast({ title: t('actions.upcoming_title'), description: t('actions.upcoming_desc') })} className="gap-2 cursor-pointer">
                                                <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                                {t('actions.invoices')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedContract && (
                <EditContractSheet
                    contract={selectedContract}
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                />
            )}
        </div>
    );
}
