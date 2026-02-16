"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RefreshCw, Search } from "lucide-react";
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

export function AuditLogTable() {
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
                title: "Error",
                description: "No se pudieron cargar los logs de auditoría."
            });
        } finally {
            setLoading(false);
        }
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
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por mensaje, usuario..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos los Niveles</SelectItem>
                        <SelectItem value="INFO">Info</SelectItem>
                        <SelectItem value="WARN">Warning</SelectItem>
                        <SelectItem value="ERROR">Error</SelectItem>
                        <SelectItem value="DEBUG">Debug</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => fetchLogs()} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Fecha</TableHead>
                            <TableHead className="w-[100px]">Nivel</TableHead>
                            <TableHead>Origen / Acción</TableHead>
                            <TableHead>Mensaje</TableHead>
                            <TableHead className="text-right">Usuario</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log._id} className={log.level === 'ERROR' ? 'bg-red-50/50' : ''}>
                                <TableCell className="font-mono text-xs">
                                    {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={LEVEL_COLORS[log.level] || ""}>
                                        {log.level}
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
                                    {log.userEmail || "Sistema"}
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No se encontraron eventos de auditoría.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
