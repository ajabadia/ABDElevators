"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Lock,
    ClipboardList,
    Workflow,
    History
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AuditLogViewer } from "./AuditLogViewer";
import { WorkflowExecutionViewer } from "./WorkflowExecutionViewer";
import { SecurityStatusViewer } from "./SecurityStatusViewer";
import { EvidenceReportViewer } from "./EvidenceReportViewer";

/**
 * 🛡️ GovernanceHub (Era 12 / SOC2)
 * Centralizes Audit, Operations, Security and Compliance.
 * Removed internal PageContainer/Header as it's now wrapped in FeatureShell.
 */
export function GovernanceHub() {
    const t = useTranslations("insights");

    return (
        <div className="mt-8">
            <Tabs defaultValue="audit" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Auditoría
                    </TabsTrigger>
                    <TabsTrigger value="ops" className="flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        Operaciones
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Cumplimiento
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="audit" className="animate-in fade-in duration-500">
                    <AuditLogViewer />
                </TabsContent>

                <TabsContent value="ops" className="animate-in fade-in duration-500">
                    <WorkflowExecutionViewer />
                </TabsContent>

                <TabsContent value="security" className="animate-in fade-in duration-500">
                    <SecurityStatusViewer />
                </TabsContent>

                <TabsContent value="compliance" className="animate-in fade-in duration-500">
                    <EvidenceReportViewer />
                </TabsContent>
            </Tabs>
        </div>
    );
}
