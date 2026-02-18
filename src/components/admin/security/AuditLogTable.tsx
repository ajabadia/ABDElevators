"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslations, useFormatter } from "next-intl";
import { Download, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
    _id: string;
    level: string;
    source: string;
    action: string;
    message: string;
    timestamp: string;
    userEmail?: string;
}

const LEVEL_COLORS: Record<string, string> = {
    INFO: "bg-blue-100 text-blue-800",
    WARN: "bg-yellow-100 text-yellow-800",
    ERROR: "bg-red-100 text-red-800 border-red-200",
    DEBUG: "bg-gray-100 text-gray-800"
};

/**
 * 📊 Audit Log Table
 * Displays application logs with filtering and export capabilities.
 * Standardized with Phase 175.7 i18n & a11y requirements.
 */
export function AuditLogTable() {
    const t = useTranslations("security_hub");
    const format = useFormatter();
    const { toast } = useToast();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("ALL");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (levelFilter !== 'ALL') params.set('level', levelFilter);

            const res = await fetch(`/api/audit/logs?${params.toString()}`);
            if (!res.ok) throw new Error("Error fetching logs");

            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: t("audit.table.error_title") || "Error",
                description: t("audit.table.error_fetch") || "No se pudieron cargar los logs de auditoría."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.set('type', 'audit_logs');
        params.set('format', 'csv');
        if (search) params.set('search', search);
        if (levelFilter !== 'ALL') params.set('level', levelFilter);

        window.location.href = `/api/admin/export?${params.toString()}`;
    };

    const handleRefresh = () => {
        fetchLogs();
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, levelFilter]);

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        placeholder={t("audit.table.search_placeholder")}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label={t("audit.table.search_placeholder")}
                    />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[180px]" aria-label={t("audit.table.level")}>
                        <SelectValue placeholder={t("audit.table.level")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">{t("audit.levels.all")}</SelectItem>
                        <SelectItem value="INFO">{t("audit.levels.info")}</SelectItem>
                        <SelectItem value="WARN">{t("audit.levels.warn")}</SelectItem>
                        <SelectItem value="ERROR">{t("audit.levels.error")}</SelectItem>
                        <SelectItem value="DEBUG">{t("audit.levels.debug")}</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleExport()}
                    title={t("audit.table.export_csv")}
                    disabled={loading}
                    aria-label={t("audit.table.export_csv")}
                >
                    <Download className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRefresh()}
                    disabled={loading}
                    title={t("audit.table.refresh")}
                    aria-label={t("audit.table.refresh")}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">{t("audit.table.date")}</TableHead>
                            <TableHead className="w-[100px]">{t("audit.table.level")}</TableHead>
                            <TableHead>{t("audit.table.action")}</TableHead>
                            <TableHead>{t("audit.table.message")}</TableHead>
                            <TableHead className="text-right">{t("audit.table.user")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log._id} className={log.level === 'ERROR' ? 'bg-red-50/50' : ''}>
                                <TableCell className="font-mono text-xs">
                                    {format.dateTime(new Date(log.timestamp), {
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={LEVEL_COLORS[log.level] || ""}>
                                        {t(`audit.levels.${log.level.toLowerCase()}` as any)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-xs">{log.source}</span>
                                        <span className="text-xs text-muted-foreground">{log.action}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{log.message}</TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {log.userEmail || t("audit.table.system") || "Sistema"}
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {t("audit.table.no_results")}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
