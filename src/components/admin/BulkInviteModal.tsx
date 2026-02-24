"use client";

import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Loader2, Mail, Upload, FileType, CheckCircle2,
    AlertCircle, X, Download, HelpCircle, ChevronDown,
    ChevronUp, Info, ExternalLink, Clock
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { UserRole } from "@/types/roles";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useTranslations } from "next-intl";

interface BulkInviteModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedInvite {
    email: string;
    role: UserRole;
    isValid: boolean;
    error?: string;
}

export function BulkInviteModal({ open, onClose, onSuccess }: BulkInviteModalProps) {
    const t = useTranslations("admin.users.bulk");
    const tCommon = useTranslations("common");

    const [file, setFile] = useState<File | null>(null);
    const [invites, setInvites] = useState<ParsedInvite[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [expiresInDays, setExpiresInDays] = useState(7);

    const sampleData = [
        { email: "ingeniero@empresa.com", role: UserRole.ENGINEERING },
        { email: "tecnico@empresa.com", role: UserRole.TECHNICAL },
        { email: "admin.local@empresa.com", role: UserRole.ADMIN },
        { email: "soporte@empresa.com", role: UserRole.ADMINISTRATIVE }
    ];

    const downloadCSVTemplate = () => {
        const headers = ["email", "role"];
        const rows = sampleData.map(d => `${d.email},${d.role}`);
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_invitacion_usuarios.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadXLSXTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
        XLSX.writeFile(workbook, "plantilla_invitacion_usuarios.xlsx");
    };

    const { mutate: bulkInvite, isLoading: isSubmitting } = useApiMutation({
        endpoint: '/api/admin/users/invite/bulk',
        method: 'POST',
        onSuccess: (data: any) => {
            toast.success(t("success_title"), {
                description: t("success_desc", { success: data.results.success, failed: data.results.failed }),
            });
            if (data.results.success > 0) {
                onSuccess();
                handleClose();
            }
        }
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setFile(file);
        parseFile(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        multiple: false
    });

    const parseFile = (file: File) => {
        setIsParsing(true);
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    processRows(results.data);
                    setIsParsing(false);
                },
                error: (err) => {
                    toast.error(t("csv_read_error"), { description: err.message });
                    setIsParsing(false);
                }
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet);
                processRows(rows);
                setIsParsing(false);
            };
            reader.onerror = () => {
                toast.error(t("excel_read_error"));
                setIsParsing(false);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const processRows = (rows: any[]) => {
        const parsed: ParsedInvite[] = rows.map((row: any) => {
            // Find email and role in common columns
            const email = (row.email || row.Email || row.EMAIL || row.correo || row.Correo || "").toString().trim();
            const roleStr = (row.role || row.Role || row.ROLE || row.rol || row.Rol || "TECHNICAL").toString().trim().toUpperCase();

            let role = UserRole.TECHNICAL;
            if (Object.values(UserRole).includes(roleStr as UserRole)) {
                role = roleStr as UserRole;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = !!email && emailRegex.test(email);

            return {
                email,
                role,
                isValid,
                error: !email ? t("table.missing_email") : !isValid ? t("table.invalid_email") : undefined
            };
        });
        setInvites(parsed);
    };

    const handleInvite = () => {
        const validInvites = invites.filter(i => i.isValid).map(i => ({
            email: i.email,
            role: i.role
        }));

        if (validInvites.length === 0) {
            toast.error(tCommon("error"), { description: t("error_no_valid") });
            return;
        }

        bulkInvite({
            invitations: validInvites,
            expiresInDays
        });
    };

    const handleClose = () => {
        setFile(null);
        setInvites([]);
        onClose();
    };

    const totalValid = invites.filter(i => i.isValid).length;
    const totalInvalid = invites.filter(i => !i.isValid).length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col border-teal-100">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <Upload className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">{t("title")}</DialogTitle>
                            <DialogDescription>
                                {t("desc")}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="bg-slate-50 border-y border-slate-100 -mx-6 px-6 py-2 flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadCSVTemplate}
                            className="text-slate-600 hover:text-teal-600 h-8 text-xs"
                        >
                            <Download className="h-3 w-3 mr-1" /> CSV
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadXLSXTemplate}
                            className="text-slate-600 hover:text-teal-600 h-8 text-xs"
                        >
                            <Download className="h-3 w-3 mr-1" /> Excel
                        </Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border-r pr-4 border-slate-200">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <select
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                                className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-slate-700"
                            >
                                <option value={1}>1 {tCommon("days.one")}</option>
                                <option value={7}>7 {tCommon("days.other")}</option>
                                <option value={30}>30 {tCommon("days.other")}</option>
                            </select>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowInstructions(!showInstructions)}
                            className={`h-8 text-xs ${showInstructions ? 'text-teal-600 bg-teal-50' : 'text-slate-500'}`}
                        >
                            <HelpCircle className="h-3 w-3 mr-1" />
                            {showInstructions ? t("hide_help") : t("instructions")}
                        </Button>
                    </div>
                </div>

                {showInstructions && (
                    <div className="bg-teal-50/50 p-4 border-b border-teal-100 -mx-6 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <h4 className="font-semibold text-teal-800 mb-2 flex items-center gap-2">
                            <Info className="h-4 w-4" /> {t("format")}
                        </h4>
                        <ul className="space-y-2 text-teal-900/80 text-xs">
                            <li>• <strong>{t("table.email")}:</strong> {t("columns_help")}</li>
                            <li>• <strong>{t("table.role")}:</strong> {t("roles_help")}</li>
                            <li>• <strong>{t("table.status")}:</strong> {t("default_help")}</li>
                            <li>• <strong>UTF-8:</strong> {t("encoding_help")}</li>
                        </ul>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto py-4">
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`
                                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer
                                ${isDragActive ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/50'}
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                                <FileType className="h-6 w-6 text-teal-600" />
                            </div>
                            <p className="text-slate-600 font-medium mb-1">
                                {isDragActive ? t("drop_active") : t("drop_idle")}
                            </p>
                            <p className="text-slate-400 text-sm">{t("file_hint")}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <FileType className="h-5 w-5 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                                    <span className="text-xs text-slate-400">({t("detected_rows", { count: invites.length })})</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="h-8 w-8 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">{t("table.email")}</th>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">{t("table.role")}</th>
                                            <th className="px-4 py-2 text-right font-semibold text-slate-600">{t("table.status")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {invites.slice(0, 10).map((invite, idx) => (
                                            <tr key={idx} className={invite.isValid ? '' : 'bg-red-50/30'}>
                                                <td className="px-4 py-2 text-slate-700">
                                                    {invite.email || <em className="text-slate-400">{t("table.no_email")}</em>}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded uppercase">
                                                        {invite.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {invite.isValid ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                                                    ) : (
                                                        <div className="flex items-center gap-1 justify-end text-red-500 text-xs">
                                                            <AlertCircle className="h-3 w-3" /> {invite.error}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {invites.length > 10 && (
                                    <div className="px-4 py-2 bg-slate-50 text-xs text-center text-slate-500 border-t">
                                        Y {invites.length - 10} filas más...
                                    </div>
                                )}
                            </div>

                            {(totalValid > 0 || totalInvalid > 0) && (
                                <div className="flex gap-4 pt-2">
                                    <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-2">
                                        <div className="text-lg font-bold text-emerald-700">{totalValid}</div>
                                        <div className="text-xs text-emerald-600 font-medium">{t("valid_to_send")}</div>
                                    </div>
                                    {totalInvalid > 0 && (
                                        <div className="flex-1 bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2">
                                            <div className="text-lg font-bold text-red-700">{totalInvalid}</div>
                                            <div className="text-xs text-red-600 font-medium">{t("with_errors")}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                        {tCommon("cancel")}
                    </Button>
                    <Button
                        onClick={handleInvite}
                        disabled={!file || totalValid === 0 || isSubmitting || isParsing}
                        className="bg-teal-600 hover:bg-teal-700 min-w-[120px]"
                    >
                        {isSubmitting || isParsing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isParsing ? t("parsing") : t("sending")}
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                {t("invite_button", { count: totalValid > 0 ? totalValid : '' })}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
