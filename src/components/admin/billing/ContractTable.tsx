
"use client";

import { useState } from "react";
import { useApiList } from "@/hooks/useApiList";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
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
    AlertTriangle,
    CheckCircle,
    Ban,
    Edit,
    FileText
} from "lucide-react";
import { EditContractSheet } from "./EditContractSheet";
import { cn } from "@/lib/utils";

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
    };
    limits: {
        tokens: number;
        storage: number;
    };
    mrr: number;
    nextBillingDate: string;
}

export function ContractTable() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data: contracts, isLoading, refresh } = useApiList<Contract>({
        endpoint: '/api/admin/billing/contracts',
        filters: { page, limit: 10, search },
        dataKey: 'contracts',
        debounceMs: 500
    });

    const t = useTranslations('admin.billing.contracts');

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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('table.search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.tenant')}</TableHead>
                            <TableHead>{t('table.plan')}</TableHead>
                            <TableHead>{t('table.override')}</TableHead>
                            <TableHead>{t('table.usage')}</TableHead>
                            <TableHead>{t('table.mrr')}</TableHead>
                            <TableHead>{t('table.status')}</TableHead>
                            <TableHead className="text-right">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && contracts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {t('table.loading')}
                                </TableCell>
                            </TableRow>
                        )}

                        {!isLoading && contracts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {t('table.empty')}
                                </TableCell>
                            </TableRow>
                        )}

                        {contracts.map((contract: Contract) => (
                            <TableRow key={contract.tenantId}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{contract.name}</span>
                                        <span className="text-xs text-muted-foreground">{contract.tenantId}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{contract.tier}</Badge>
                                </TableCell>
                                <TableCell>
                                    {contract.customOverrides ? (
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200">
                                            Custom
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-muted-foreground">Tokens:</span>
                                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${Math.min((contract.usage.tokens / contract.limits.tokens) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span>
                                                {Intl.NumberFormat('en', { notation: "compact" }).format(contract.usage.tokens)} /
                                                {contract.limits.tokens === Infinity ? '∞' : Intl.NumberFormat('en', { notation: "compact" }).format(contract.limits.tokens)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-muted-foreground">Store:</span>
                                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500"
                                                    style={{ width: `${Math.min((contract.usage.storage / contract.limits.storage) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span>
                                                {Intl.NumberFormat('en', { notation: "compact", style: 'unit', unit: 'byte' }).format(contract.usage.storage)} /
                                                {contract.limits.storage === Infinity ? '∞' : Intl.NumberFormat('en', { notation: "compact", style: 'unit', unit: 'byte' }).format(contract.limits.storage)}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono font-medium">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(contract.mrr)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("border-0", getStatusColor(contract.status))}>
                                        {t(`status.${contract.status.toLowerCase() as 'active' | 'past_due' | 'blocked'}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditClick(contract)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                {t('actions.edit')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => alert("Próximamente: Historial de facturas")}>
                                                <FileText className="mr-2 h-4 w-4" />
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

            {/* Pagination Implementation could go here */}

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
